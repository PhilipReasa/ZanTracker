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
  console.log(userID)
  console.log(phoneNumber)
  console.log(slackUserName)
  
  // var existingUser = ;
  users.find({
    userID: userID
  }).count().then (
    count => {
      if (count > 0) {
        // Exists
        var dict = {
            phoneNumber: phoneNumber,
            slackUserName: slackUserName
        }
        updateUser(userID, dict)
      } else {
        var dict = {
          userID: userID,
          phoneNumber: phoneNumber,
          slackUserName: slackUserName,
          packages: []
        }
        addUser(dict)
      }
    },
    err => console.log(err)
  )
  
  res.send(userID);
});

function addUser(dict) {
  console.log('Adding')
  console.log(dict)
  users.insert(dict) 
}

function updateUser(userID, dict) {
  console.log('Updating' + userID)
  console.log(dict)
  users.update(
        { userID: userID },
        dict
      )
}


function findUser(username) {

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
