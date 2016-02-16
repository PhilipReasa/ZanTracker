//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var request = require('request');
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

// Twillio
var client = require('twilio')('AC6d02e579c86e7f668c36fd49ef59aa9c', '9ac76939e6b333815965a61bb3e020f3');

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

// Twilio Integration ( TEST END POINT -- Do not use lol)
router.get('/sendMessage', function(req,res) {
  var _userID = (req.query.id);
  
  // Get packages
  var userModel = users.find({userID: {$eq: _userID}})
  userModel.each(function(err,doc) {
    if (err) alert('Error!')
    
    if (doc!=null) {
      if (doc.phoneNumber) {
        console.log('Has phone number')
        sendMessage(doc.phoneNumber, 'Hello world!')
        
        res.send ('Message sent to : '+ doc.phoneNumber)
      } else {
        res.send ('User has no phone number')
      }
      
    }
  })
  
  
})

// User signup / update phone numbers or slack usernames
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

// Add package to user
// @params: id, packageID, packageCarrier
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

// Get current user packages
// @params: id
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

// Get current user packages data from Shippo
// @params: id
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
              output.push(JSON.parse(body))
              console.log("Pushed !")
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

// Webhook for Shippo. Does not work yet
router.post('/shippoWebhook', function(req,res) {
  console.log('Hooked!')
  
  // Simulate webhook through postman?
  var packageID = (req.body.packageID);
  var packageCarrier = (req.body.packageCarrier);
  
  // Do necessary push notifications and stuff here.
  
  /* Twillio */
  
  /* Slack bot */
  
  /* Web app / socket.io */
  res.send('Success')
})

router.get('/slackCommand', function(req, res) {
  var parameters = req.query.text.split(" ");
  var command = req.query.command;
  var url_return = req.query.response_url;
  var username = req.query.user_name;
  var response_type = 'ephemeral';
  var response_text;
  
  var responseData = {
    "response_type": response_type,
    "text": response_text
  };
  
  switch(parameters[0]) {
    // Create or update an user
    case 'login': {
      responseData.text = "Welcome back " + username + "!"
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(responseData));

      users.find({
        userID: username
      }).count().then (
        count => {
          if (count > 0) {
            console.log('IF slack user does Exist')
            // Exists - Get user packages
            var userModel = users.find({userID: {$eq: username}})
            userModel.each(function(err,doc) {
              if (err) alert('Error!')
              
              if (doc!=null) {
                // Doc is our dict now
                // Get current packages
                if (doc.packages != null && doc.packages.length > 0) {
                  responseData.text = "These are the packages that I'm tracking for you!\n";
                  
                  for (var i = 0; i < doc.packages.length; i++) {
                    responseData.text = responseData.text + doc.packages[i].carrier + " - Tracking: " + doc.packages[i].id + "\n";
                  }
                  
                  responseData.text = responseData.text + "I'll send you any updates for these packages, but you can always retrieve the status manually with this command:\n";
                  responseData.text = responseData.text + command + " get [tracking number]";
                  responseData.text = responseData.text + "Just grab a :coffee: and relax! Your packages are coming!";
                } else {
                  responseData.text = "You still don't have any packages to track!\n";
                  responseData.text = responseData.text + "You can add packages using this command:\n";
                  responseData.text = responseData.text + command + " add [carrier] [tracking number]\n";
                  responseData.text = responseData.text + "Have fun!";
                }
                
                request.post({
                  headers: {'content-type' : 'application/json'},
                  url:     url_return,
                  body:    JSON.stringify(responseData)
                });
              }
            })
            
          } else {
            console.log('IF slack user does not Exist')
            var dict = {
              userID: username,
              slackUserName: username,
              packages: null,
            }
            addUser(dict)
            
            responseData.text = "Start tracking your packages with this command:\n";
            responseData.text = responseData.text + command + " add [carrier] [tracking number]\n";
            responseData.text = responseData.text + "Have fun!";
            
            request.post({
              headers: {'content-type' : 'application/json'},
              url:     url_return,
              body:    JSON.stringify(responseData)
            });
          }
        },
        err => console.log(err)
      )
      
      break;  
    }
    
    case 'add': {
      var carrier = parameters[1];
      var tracking = parameters[2];
      if (!carrier || !tracking) {
        responseData.text = "Sorry " + username + "! I think your forgot some parameters on your command! The right syntax is:\n";
        responseData.text = responseData.text + command + " add [carrier] [tracking number]";
        
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(responseData));
      } else {
        // Make new package object
        var newPackage = {
          id: tracking,
          carrier: carrier,
        }
          
        users.find({
          userID: username
        }).count().then (
          count => {
            if (count > 0) {
              // Exists
              addPackage(username, newPackage)
              
              responseData.text = "Ok " + username + "! I just added this package to track for you:\n";
              responseData.text = responseData.text + "Carrier: " + carrier + " - Tracking number: " + tracking + "\n";
              responseData.text = responseData.text + "I'll message you every time that your tracking is updated!\n";
              responseData.text = responseData.text + "Now you just need to relax! :sunglasses:\n";
              responseData.text = responseData.text + "You can type this command if you want to get an instant status:\n";
              responseData.text = responseData.text + command + " get " + tracking;
            } else {
              responseData.text = "Hey " + username + "! I couldn't find your user on my records!\n";
              responseData.text = responseData.text + "But don't worry! Just type this command so we can setup your user!\n";
              responseData.text = responseData.text + command + " login";
            }
            
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(responseData));
          },
          err => {console.log(err),res.send(err)}
        )
      }
      
      break;
    }
    
    case 'list': {
      users.find({
        userID: username
      }).count().then (
        count => {
          if (count > 0) {
            console.log('IF slack user does Exist')
            // Exists - Get user packages
            var userModel = users.find({userID: {$eq: username}})
            userModel.each(function(err,doc) {
              if (err) alert('Error!')
              
              if (doc!=null) {
                // Doc is our dict now
                // Get current packages
                if (doc.packages != null && doc.packages.length > 0) {
                  responseData.text = "Hi " + username + "! These are the packages that I'm tracking for you!\n";
                  
                  for (var i = 0; i < doc.packages.length; i++) {
                    responseData.text = responseData.text + doc.packages[i].carrier + " - Tracking: " + doc.packages[i].id + "\n";
                  }
                  
                  responseData.text = responseData.text + "I'll send you any updates for these packages, but you can always retrieve the status manually with this command:\n";
                  responseData.text = responseData.text + command + " get [tracking number]";
                  responseData.text = responseData.text + "Just grab a :coffee: and relax! Your packages are coming!";
                } else {
                  responseData.text = "Hi " + username + "! You still don't have any packages to track!\n";
                  responseData.text = responseData.text + "You can add packages using this command:\n";
                  responseData.text = responseData.text + command + " add [carrier] [tracking number]\n";
                  responseData.text = responseData.text + "Have fun!";
                }
                
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify(responseData));
              }
            })
            
          } else {
            responseData.text = "Hey " + username + "! I couldn't find your user on my records!\n";
            responseData.text = responseData.text + "But don't worry! Just type this command so we can setup your user!\n";
            responseData.text = responseData.text + command + " login";
            
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(responseData));
          }
        },
        err => console.log(err)
      )
      
      break;
    }
    
    case 'get': {
      var tracking = parameters[1];
      if (!tracking) {
        responseData.text = "Sorry " + username + "! I think you forgot to tell me the tracking number of your package! The right syntax is:\n";
        responseData.text = responseData.text + command + " get [tracking number]";
        
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(responseData));
      } else {
        users.find({
          userID: username
        }).count().then (
          count => {
            if (count > 0) {
              responseData.text = "Ok " + username +"! Let me check your package status! Give me a sec!";
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify(responseData));
        
              // Get packages
              var userModel = users.find({userID: {$eq: username}})
              userModel.each(function(err,doc) {
                if (err) alert('Error!')
                
                if (doc!=null) {
                  var output = [];
                  // Doc is our dict now
                  // Get current packages
                  if (doc.packages) {
                    console.log('Has existing package')
                    // Find the package
                    var packageObj = null;
                    for (var i = 0; i < doc.packages.length; i++) {
                      if (doc.packages[i].id == tracking) {
                        packageObj = doc.packages[i];
                        break;
                      }
                    }
                    
                    if (!packageObj) {
                      responseData.text = "Oooops " + username + "! I couldn't find this package on your account!\n";
                      responseData.text = responseData.text + "Try to add it first with this command:\n";
                      responseData.text = responseData.text + command + " add [carrier] " + tracking;
                      
                      request.post({
                        headers: {'content-type' : 'application/json'},
                        url:     url_return,
                        body:    JSON.stringify(responseData)
                      });
                    } else {
                      // Call Hippo API
                      var requestURL = 'http://hackers-api.goshippo.com/v1/tracks/'+ packageObj.carrier + '/' + packageObj.id
                      console.log(requestURL)
                      request(requestURL , function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                          var trackingStatus = body[0];
                          console.log(trackingStatus.tracking_status.status);
                        }
                      })
                    }
                  } else {
                    responseData.text = "Hi " + username + "!It looks like you still don't have any packages to track!\n";
                    responseData.text = responseData.text + "You can add packages using this command:\n";
                    responseData.text = responseData.text + command + " add [carrier] [tracking number]\n";
                    responseData.text = responseData.text + "Have fun!";
                    
                    request.post({
                      headers: {'content-type' : 'application/json'},
                      url:     url_return,
                      body:    JSON.stringify(responseData)
                    });
                  }
                }
              })
            } else {
              responseData.text = "Hey " + username + "! I couldn't find your user on my records!\n";
              responseData.text = responseData.text + "But don't worry! Just type this command so we can setup your user!\n";
              responseData.text = responseData.text + command + " login";
              
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify(responseData));
            }
          },
          err => console.log(err)
        )
      }
      break;
    }
    
    // Help message
    default: {
      responseData.text = "Hi " + username + "! Grab a :coffee: and relax! Your package is coming! :sunglasses:\n";
      responseData.text = responseData.text + "Here are the available commands:\n" 
      responseData.text = responseData.text + command + " login - To identify yourself with your slack username.\n";
      responseData.text = responseData.text + command + " add [carrier] [tracking number] - To start tracking a package.\n";
      responseData.text = responseData.text + command + " get [tracking number] - Get tracking of a specific package.\n";
      responseData.text = responseData.text + command + " list - List all your packages.\n";
      
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(responseData));
    }
  }
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
        packages : doc.packages
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

/* Twilio function */
function sendMessage(phoneNumber, messageContent) {
    //Send an SMS text message
  client.sendMessage({
  
      to:phoneNumber, // Any number Twilio can deliver to
      from: '+16504092002', // A number you bought from Twilio and can use for outbound communication
      body: messageContent // body of the SMS message
  
  }, function(err, responseData) { //this function is executed when a response is received from Twilio
  
      if (!err) { // "err" is an error received during the request, if any
          // "responseData" is a JavaScript object containing data received from Twilio.
          // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
          // http://www.twilio.com/docs/api/rest/sending-sms#example-1
          console.log(responseData.from); // outputs phoneNumber
          console.log(responseData.body); // outputs messageContent
      } else {
        
      }
  });  
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
