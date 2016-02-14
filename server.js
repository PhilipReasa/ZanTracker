//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var bodyParser = require('body-parser')
var request = require('request');

var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var db;
var users;

// Connect to the db
MongoClient.connect("mongodb://celsoendo-trackingzen-2566763:27017/trackerData", function(err, _db) {
  if(!err) {
    console.log("We are connected");
    db = _db;
    users = db.collection('users');
  }
});

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);
router.use(bodyParser.json())
router.use(express.json())

router.post('/user', function (req, res) {
  var userID = (req.body.id);
  var phoneNumber = (req.body.phoneNumber);
  var slackUserName = (req.body.slackUserName);
  
  users.find({
    userID: userID
  }).count().then (
    count => {
      if (count > 0) {
        // Exists
        console.log('IF Exist')
        updateUser(userID, phoneNumber, slackUserName)
      } else {
        console.log('IF does not Exist')
        var dict = {
          userID: userID,
          phoneNumber: phoneNumber,
          slackUserName: slackUserName,
          packages: null,
        }
        addUser(dict)
      }
    },
    err => console.log(err)
  )
  
  res.send(userID);
});

router.post('/addPackage' , function(req,res) {
  var userID = (req.body.id);
  var packageID = (req.body.packageID);
  var packageCarrier = (req.body.packageCarrier);
  
  // Make new package object
  var newPackage = {
    id: packageID,
    carrier: packageCarrier,
  }
    
  users.find({
    userID: userID
  }).count().then (
    count => {
      if (count > 0) {
        // Exists
        res.send('Adding package to ' + userID)
        addPackage(userID, newPackage)
      } else {
        res.send('User does not exist')
      }
    },
    err => {console.log(err),res.send(err)}
    
  )
})

router.get('/getPackages' , function(req,res) {
  var _userID = (req.query.id);
  
  // Get packages
  var userModel = users.find({userID: {$eq: _userID}})
  userModel.each(function(err,doc) {
    if (err) alert('Error!')
    
    if (doc!=null) {
      // Doc is our dict now
      // Get current packages
      if (doc.packages) {
        console.log('Has existing package')
        res.send (doc.packages)
      } else {
        res.send ('empty')
      }
      
    }
  })

  
  
})

router.get('/getHippoPackages', function(req,res) {
  var _userID = (req.query.id);
  
  // Get packages
  var userModel = users.find({userID: {$eq: _userID}})
  userModel.each(function(err,doc) {
    if (err) alert('Error!')
    
    if (doc!=null) {
      var output = [];
      // Doc is our dict now
      // Get current packages
      if (doc.packages) {
        console.log('Has existing package')
        // Call Hippo API
        async.forEach(doc.packages, function (package, callback){ 
          var requestURL = 'http://hackers-api.goshippo.com/v1/tracks/'+ package.carrier + '/' + package.id
          console.log(requestURL)
          request(requestURL , function (error, response, body) {
            if (!error && response.statusCode == 200) {
              output.push(body)
              console.log('Pushed!')
            }
            if (output.length == doc.packages.length) {
              res.send(output)
            }
          })
        }, function(err) {
          res.send('Error')
        });  
      } else {
        res.send ('empty')
      }
    }
  })
})

router.get('/testCelso', function(req, res) {
  var parameters = req.query.text.split(" ");
  var command = req.query.command;
  var response_type = 'ephemeral';
  var response_text;
  
  switch(parameters[0]) {
    case 'help': {
      response_text = "Hi " + req.query.user_name + "!\\n" +
                    + "Here are the available commands:\\n" +
                    + command + " track [package number] - Retrieve your package information\\n";
    }
  }
  
  var responseData = {
    'response_type': response_type,
    'text': response_text
  };
  
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(responseData));
});

/* Functions for users */

function addUser(dict) {
  users.insert(dict) 
}

function updateUser(_userID, _phoneNumber, _slackUserName) {
  console.log('USER: ' +_userID)
  var userModel = users.find({userID: {$eq: _userID}})
  userModel.each(function(err,doc) {
    if (err) return
    
    if (doc!=null) {
      // Doc is our dict now
      var newPhoneNumber = doc.phoneNumber
      var newSlackUserName = doc.slackUserName
      if (_phoneNumber) {
        newPhoneNumber = _phoneNumber
      }
      if (_slackUserName) {
        newSlackUserName = _slackUserName
      }
      var dict = {
        userID : _userID,
        phoneNumber : newPhoneNumber,
        slackUserName : newSlackUserName,
        packages : userModel.packages
      }
      users.update(
            { userID: _userID },
            dict
      )
    }
  })

  
}


/* Function to add package to a user */
function addPackage(_userID, packageObject) {
  var userModel = users.find({userID: {$eq: _userID}})
  userModel.each(function(err,doc) {
    if (err) alert('Error!')
    
    if (doc!=null) {
      // Doc is our dict now
      // Get current packages
      var userPackages = [];
      if (doc.packages) {
        console.log('Has existing package')
        userPackages = doc.packages
      } 
      // Add to list of user packages
      userPackages.push(packageObject)
      console.log(userPackages)
        // Save to database
      users.update(
        { userID: doc.userID },
        {
          userID: doc.userID,
          phoneNumber: doc.phoneNumber,
          slackUserName: doc.slackUserName,
          packages: userPackages,
        }
      )
    }
  })

}

router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];

io.on('connection', function (socket) {
    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
    });
  });

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at ", addr.address + ":" + addr.port);
});
