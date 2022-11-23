const express = require("express");
const path= require("path");
const app=express();
const hbs = require("hbs");
const http = require("http").createServer(app);
const port=process.env.PORT || 3000;
const axios = require('axios')
// if(process.env.NODE_ENV !== 'production'){
//   require('dotenv').config()
// }

http.listen(port, () => {
  console.log("listen on the port.");
});

// app.listen(port,()=>{ 
//     console.log(`server is running at port no ${port}`);
// });

require("./db/conn");
const Register = require("./models/registers")


const static_path= path.join(__dirname,"../public");
const views_path= path.join(__dirname,"../templates/views");
const partials_path= path.join(__dirname,"../templates/partials");

app.use(express.json());
app.use(express.urlencoded({extended:false}));


app.use(express.static(static_path));
app.set("view engine","hbs");
app.set("views",views_path);
hbs.registerPartials(partials_path);


app.get("/",(req,res)=>{
    res.render("homepage");
})
app.get("/index",(req,res)=>{
    res.render("index");
})
app.get("/speedtest",(req,res)=>{
  res.render("speedtest");
})

app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.post("/register",async(req,res)=>{
    try {
        const registerUser =new Register({
            username : req.body.username,
            password : req.body.password
        })
        const registerd =await registerUser.save();
        res.status(201).render("index")
    } catch (error) {
        res.status(400).send(error);
    }
})

app.post("/login",async(req,res)=>{
    try {
        const email= req.body.email;
        const password= req.body.password;
        
        const user = await Register.findOne({username:email});
        
        if(user.password===password){
            res.status(201).render("index");
        }else{
            res.send("invalid password");
        }

    } catch (error) {
        res.status(400).send("invalid email");
    }
})



const io = require("socket.io")(http);

//* 2. Setting the intitial server conditions.
let rooms = {};

var Room = function (name, hostName) {
  this.host = hostName;
  this.roomName = name;
  this.gameStarted = false;
  this.players = {};
};
class MultiplayerRace{
  constructor(name, hostName) {
    this.host = hostName;
    this.roomName = name;
    this.gameStarted = false;
    this.players = {};
  }
  joinRoom(){
    socket.on("joiningAGame", (roomName, playerName, playerId) => {
      //  * Write logic for the joining of the room.
      console.log(rooms);
      if (roomName in rooms) {
        if (playerName in rooms[roomName].players) {
          socket.emit("playerAlreadyJoined");
        } else {
          if (rooms[roomName].gameStarted) {
            socket.emit("gameInProgress");
          } else {
            socket.playerName = playerName;
            socket.roomName = roomName;
  
            // var newPlayer = new Player(playerName, playerId);
            var newPlayer = new User(playerName, playerId);
            rooms[roomName].players[playerName] = newPlayer;
  
            // * Joining the room
            socket.join(roomName);
  
            // * Room exists.
            socket.emit("roomExists");
  
            // * Sending the join message to all other players.
            socket.broadcast
              .in(roomName)
              .emit("chat-message", `${playerName} joined `, "chat");
  
            // * Sending the join message to all other players.
            io.to(playerId).emit(
              "chat-message",
              `Welcome to the group ${playerName} !`,
              "chat"
            );
  
            // * Sending the players name of the host.
            io.to(playerId).emit(
              "chat-message",
              `Host : ${rooms[roomName].host}`,
              "chat"
            );
  
            // * Sending the players name of all members in the room.
            io.to(playerId).emit(
              "chat-message",
              `Members in the room : ${Object.keys(rooms[roomName].players)} !`,
              "chat"
            );
  
            // * Updating the room length.
            io.in(roomName).emit("set-room-data", rooms[roomName].players);
          }
        }
      } else {
        socket.emit("roomNotExists");
      }
    });
  }
  startRace(){
    socket.on("gameStarted", (playerName, roomName, sentenceText) => {
      if (playerName == rooms[roomName].host) {
        rooms[roomName].gameStarted = true;
  
        for (const x in rooms[roomName].players) {
          rooms[roomName].players[x].playerFinished = false;
          rooms[roomName].players[x].playerData = {};
        }
  
        io.in(roomName).emit("gameStartedCondition", sentenceText);
      } else {
        console.error("A non host player tried to get in the system.");
      }
    });
  }
  leaveRoom(){
    socket.on("disconnect", () => {
      // checking if player is in a room :
      let currentPlayerName = socket.playerName;
      let currentPlayerRoomName = socket.roomName;
  
      if (currentPlayerName && rooms[currentPlayerRoomName]) {
        let currentPlayerRoom = rooms[currentPlayerRoomName];
  
        // Deleting the player from the room.
        delete currentPlayerRoom.players[currentPlayerName];
  
        // Checking how many players are remaining to finish.
        let playersNotFinished = Object.keys(currentPlayerRoom.players).filter(
          (playerElement) =>
            !currentPlayerRoom.players[playerElement].playerFinished
        );
  
        // New length :
        let keys = Object.keys(currentPlayerRoom.players);
        let roomLength = keys.length;
  
        console.table(currentPlayerRoom.players);
  
        if (currentPlayerRoom.host == currentPlayerName) {
          if (roomLength == 0) {
            delete rooms[currentPlayerRoomName];
            // console.table(rooms);
          } else {
            let newHost = keys[(roomLength * Math.random()) << 0];
  
            currentPlayerRoom.host = newHost;
  
            playersInfo = currentPlayerRoom.players;
  
            // Displaying the message that the player left the room.
            io.in(socket.roomName).emit(
              "chat-message",
              `${socket.playerName} left the Room and ${newHost} is the new Host.`,
              "chat"
            );
  
            // Updating the room length.
            io.in(socket.roomName).emit(
              "set-room-data",
              rooms[currentPlayerRoomName].players
            );
          }
        } else {
          console.log("this is running");
  
          // console.table(currentPlayerRoom.players);
  
          // Updating the room length.
          // Displaying the message that the player left the room.
          io.in(currentPlayerRoomName).emit(
            "chat-message",
            `${currentPlayerName} left the Room `,
            "chat"
          );
  
          io.in(currentPlayerRoomName).emit(
            "set-room-data",
            rooms[currentPlayerRoomName].players
          );
        }
  
        try {
          hostId =
            currentPlayerRoom.players[rooms[currentPlayerRoomName].host].playerId;
          if (playersNotFinished == 0 || !currentPlayerRoom.gameStarted)
            io.to(hostId).emit("showStartButton");
        } catch (e) {
          console.log("hostId is not defined.");
        }
      }
    });
  }
  displayResults(){
    socket.on("playerFinished", (playerName, roomName, playerData) => {
      rooms[roomName].players[playerName].playerData = playerData;
      rooms[roomName].players[playerName].playerFinished = true;
  
      playersInfo = rooms[roomName].players;
  
      playersNotFinished = Object.keys(rooms[roomName].players).filter((key) => {
        return !rooms[roomName].players[key].playerFinished;
      });
  
      if (playersNotFinished.length == 0) {
        rooms[roomName].gameStarted = false;
        host = rooms[roomName].host;
        hostId = rooms[roomName].players[host].playerId;
        if (playersNotFinished == 0 || !currentPlayerRoom.gameStarted)
          io.to(hostId).emit("showStartButton");
      }
  
      io.in(roomName).emit("refreshGraph", rooms[roomName].players);
  
      // * Sending the join message to all other players.
      socket.broadcast
        .in(roomName)
        .emit("chat-message", `${playerName} finished ! `, "chat");
    });
  }
  provideRoomID(){
    socket.on("hostingAGame", (roomName, playerName, playerId) => {
      socket.playerName = playerName;
      socket.roomName = roomName;
  
      // var newRoom = new Room(roomName, playerName);
      // var newPlayer = new Player(playerName, playerId);
      var newRoom = new MultiplayerRace(roomName, playerName);
      var newPlayer = new User(playerName,playerId);
  
      rooms[roomName] = newRoom;
      rooms[roomName].players[playerName] = newPlayer;
      console.log(rooms);
  
      // Joining the room.
      socket.join(roomName);
  
      // * Sending the join message to all other players.
      io.to(playerId).emit(
        "chat-message",
        `Welcome to the group ${playerName} !`,
        "chat"
      );
    });
  }
}
class User{
  constructor(name,playerId){
    this.playerName = name;
  this.playerId = playerId;
  this.playerData = {};
  this.playerFinished = false;
  }
}
  var Player = function (name, playerId) {
  this.playerName = name;
  this.playerId = playerId;
  this.playerData = {};
  this.playerFinished = false;
};

//* 3.Establishing the Connection between socket and client, this message is sent to the new connection formed.

io.on("connection", (socket) => {
  // * 3.0 Handeling Disconnect and leaving the group :

  socket.on("disconnect", () => {
    // checking if player is in a room :
    let currentPlayerName = socket.playerName;
    let currentPlayerRoomName = socket.roomName;

    if (currentPlayerName && rooms[currentPlayerRoomName]) {
      let currentPlayerRoom = rooms[currentPlayerRoomName];

      // Deleting the player from the room.
      delete currentPlayerRoom.players[currentPlayerName];

      // Checking how many players are remaining to finish.
      let playersNotFinished = Object.keys(currentPlayerRoom.players).filter(
        (playerElement) =>
          !currentPlayerRoom.players[playerElement].playerFinished
      );

      // New length :
      let keys = Object.keys(currentPlayerRoom.players);
      let roomLength = keys.length;

      console.table(currentPlayerRoom.players);

      if (currentPlayerRoom.host == currentPlayerName) {
        if (roomLength == 0) {
          delete rooms[currentPlayerRoomName];
          // console.table(rooms);
        } else {
          let newHost = keys[(roomLength * Math.random()) << 0];

          currentPlayerRoom.host = newHost;

          playersInfo = currentPlayerRoom.players;

          // Displaying the message that the player left the room.
          io.in(socket.roomName).emit(
            "chat-message",
            `${socket.playerName} left the Room and ${newHost} is the new Host.`,
            "chat"
          );

          // Updating the room length.
          io.in(socket.roomName).emit(
            "set-room-data",
            rooms[currentPlayerRoomName].players
          );
        }
      } else {
        console.log("this is running");

        // console.table(currentPlayerRoom.players);

        // Updating the room length.
        // Displaying the message that the player left the room.
        io.in(currentPlayerRoomName).emit(
          "chat-message",
          `${currentPlayerName} left the Room `,
          "chat"
        );

        io.in(currentPlayerRoomName).emit(
          "set-room-data",
          rooms[currentPlayerRoomName].players
        );
      }

      try {
        hostId =
          currentPlayerRoom.players[rooms[currentPlayerRoomName].host].playerId;
        if (playersNotFinished == 0 || !currentPlayerRoom.gameStarted)
          io.to(hostId).emit("showStartButton");
      } catch (e) {
        console.log("hostId is not defined.");
      }
    }
  });

  // * 3.1 Joining and hosting a Room.

  // * Hosting :
  socket.on("hostingAGame", (roomName, playerName, playerId) => {
    socket.playerName = playerName;
    socket.roomName = roomName;

    // var newRoom = new Room(roomName, playerName);
    // var newPlayer = new Player(playerName, playerId);
    var newRoom = new MultiplayerRace(roomName, playerName);
    var newPlayer = new User(playerName,playerId);

    rooms[roomName] = newRoom;
    rooms[roomName].players[playerName] = newPlayer;
    console.log(rooms);

    // Joining the room.
    socket.join(roomName);

    // * Sending the join message to all other players.
    io.to(playerId).emit(
      "chat-message",
      `Welcome to the group ${playerName} !`,
      "chat"
    );
  });

  // * Joining :
  socket.on("joiningAGame", (roomName, playerName, playerId) => {
    //  * Write logic for the joining of the room.
    console.log(rooms);
    if (roomName in rooms) {
      if (playerName in rooms[roomName].players) {
        socket.emit("playerAlreadyJoined");
      } else {
        if (rooms[roomName].gameStarted) {
          socket.emit("gameInProgress");
        } else {
          socket.playerName = playerName;
          socket.roomName = roomName;

          // var newPlayer = new Player(playerName, playerId);
          var newPlayer = new User(playerName, playerId);
          rooms[roomName].players[playerName] = newPlayer;

          // * Joining the room
          socket.join(roomName);

          // * Room exists.
          socket.emit("roomExists");

          // * Sending the join message to all other players.
          socket.broadcast
            .in(roomName)
            .emit("chat-message", `${playerName} joined `, "chat");

          // * Sending the join message to all other players.
          io.to(playerId).emit(
            "chat-message",
            `Welcome to the group ${playerName} !`,
            "chat"
          );

          // * Sending the players name of the host.
          io.to(playerId).emit(
            "chat-message",
            `Host : ${rooms[roomName].host}`,
            "chat"
          );

          // * Sending the players name of all members in the room.
          io.to(playerId).emit(
            "chat-message",
            `Members in the room : ${Object.keys(rooms[roomName].players)} !`,
            "chat"
          );

          // * Updating the room length.
          io.in(roomName).emit("set-room-data", rooms[roomName].players);
        }
      }
    } else {
      socket.emit("roomNotExists");
    }
  });

  // * 3.2 Now Chating.
  socket.on("send-chat-message", (message, playerName, roomName) =>
    io.in(roomName).emit("chat-message", message, playerName)
  );

  // to kick a player
  socket.on("kickPlayer", (sender, kickPlayer, roomName) => {
    if (sender === rooms[roomName].host) {
      console.log("kicked");
      if (rooms[roomName].players[kickPlayer]) {
        io.to(rooms[roomName].players[kickPlayer].playerId).emit("onKick");
      }
    }
  });

  // * 3.3 GameEnded :
  socket.on("gameStarted", (playerName, roomName, sentenceText) => {
    if (playerName == rooms[roomName].host) {
      rooms[roomName].gameStarted = true;

      for (const x in rooms[roomName].players) {
        rooms[roomName].players[x].playerFinished = false;
        rooms[roomName].players[x].playerData = {};
      }

      io.in(roomName).emit("gameStartedCondition", sentenceText);
    } else {
      console.error("A non host player tried to get in the system.");
    }
  });

  socket.on("playerFinished", (playerName, roomName, playerData) => {
    rooms[roomName].players[playerName].playerData = playerData;
    rooms[roomName].players[playerName].playerFinished = true;

    playersInfo = rooms[roomName].players;

    playersNotFinished = Object.keys(rooms[roomName].players).filter((key) => {
      return !rooms[roomName].players[key].playerFinished;
    });

    if (playersNotFinished.length == 0) {
      rooms[roomName].gameStarted = false;
      host = rooms[roomName].host;
      hostId = rooms[roomName].players[host].playerId;
      if (playersNotFinished == 0 || !currentPlayerRoom.gameStarted)
        io.to(hostId).emit("showStartButton");
    }

    io.in(roomName).emit("refreshGraph", rooms[roomName].players);

    // * Sending the join message to all other players.
    socket.broadcast
      .in(roomName)
      .emit("chat-message", `${playerName} finished ! `, "chat");
  });
});



async function APIResponse(category){
  let res= await axios.get(`https://api.chucknorris.io/jokes/random?category=${category}`);
  //console.log(res.data?.id)
  return res.data;
}
// module.exports = function(io){

//   io.on("connection", (socket) => {
//     // * 3.0 Handeling Disconnect and leaving the group :
  
//     socket.on("disconnect", () => {
//       // checking if player is in a room :
//       let currentPlayerName = socket.playerName;
//       let currentPlayerRoomName = socket.roomName;
  
//       if (currentPlayerName && rooms[currentPlayerRoomName]) {
//         let currentPlayerRoom = rooms[currentPlayerRoomName];
  
//         // Deleting the player from the room.
//         delete currentPlayerRoom.players[currentPlayerName];
  
//         // Checking how many players are remaining to finish.
//         let playersNotFinished = Object.keys(currentPlayerRoom.players).filter(
//           (playerElement) =>
//             !currentPlayerRoom.players[playerElement].playerFinished
//         );
  
//         // New length :
//         let keys = Object.keys(currentPlayerRoom.players);
//         let roomLength = keys.length;
  
//         console.table(currentPlayerRoom.players);
  
//         if (currentPlayerRoom.host == currentPlayerName) {
//           if (roomLength == 0) {
//             delete rooms[currentPlayerRoomName];
//             // console.table(rooms);
//           } else {
//             let newHost = keys[(roomLength * Math.random()) << 0];
  
//             currentPlayerRoom.host = newHost;
  
//             playersInfo = currentPlayerRoom.players;
  
//             // Displaying the message that the player left the room.
//             io.in(socket.roomName).emit(
//               "chat-message",
//               `${socket.playerName} left the Room and ${newHost} is the new Host.`,
//               "chat"
//             );
  
//             // Updating the room length.
//             io.in(socket.roomName).emit(
//               "set-room-data",
//               rooms[currentPlayerRoomName].players
//             );
//           }
//         } else {
//           console.log("this is running");
  
//           // console.table(currentPlayerRoom.players);
  
//           // Updating the room length.
//           // Displaying the message that the player left the room.
//           io.in(currentPlayerRoomName).emit(
//             "chat-message",
//             `${currentPlayerName} left the Room `,
//             "chat"
//           );
  
//           io.in(currentPlayerRoomName).emit(
//             "set-room-data",
//             rooms[currentPlayerRoomName].players
//           );
//         }
  
//         try {
//           hostId =
//             currentPlayerRoom.players[rooms[currentPlayerRoomName].host].playerId;
//           if (playersNotFinished == 0 || !currentPlayerRoom.gameStarted)
//             io.to(hostId).emit("showStartButton");
//         } catch (e) {
//           console.log("hostId is not defined.");
//         }
//       }
//     });
  
//     // * 3.1 Joining and hosting a Room.
  
//     // * Hosting :
//     socket.on("hostingAGame", (roomName, playerName, playerId) => {
//       socket.playerName = playerName;
//       socket.roomName = roomName;
  
//       // var newRoom = new Room(roomName, playerName);
//       // var newPlayer = new Player(playerName, playerId);
//       var newRoom = new MultiplayerRace(roomName, playerName);
//       var newPlayer = new User(playerName,playerId);
  
//       rooms[roomName] = newRoom;
//       rooms[roomName].players[playerName] = newPlayer;
//       console.log(rooms);
  
//       // Joining the room.
//       socket.join(roomName);
  
//       // * Sending the join message to all other players.
//       io.to(playerId).emit(
//         "chat-message",
//         `Welcome to the group ${playerName} !`,
//         "chat"
//       );
//     });
  
//     // * Joining :
//     socket.on("joiningAGame", (roomName, playerName, playerId) => {
//       //  * Write logic for the joining of the room.
//       console.log(rooms);
//       if (roomName in rooms) {
//         if (playerName in rooms[roomName].players) {
//           socket.emit("playerAlreadyJoined");
//         } else {
//           if (rooms[roomName].gameStarted) {
//             socket.emit("gameInProgress");
//           } else {
//             socket.playerName = playerName;
//             socket.roomName = roomName;
  
//             // var newPlayer = new Player(playerName, playerId);
//             var newPlayer = new User(playerName, playerId);
//             rooms[roomName].players[playerName] = newPlayer;
  
//             // * Joining the room
//             socket.join(roomName);
  
//             // * Room exists.
//             socket.emit("roomExists");
  
//             // * Sending the join message to all other players.
//             socket.broadcast
//               .in(roomName)
//               .emit("chat-message", `${playerName} joined `, "chat");
  
//             // * Sending the join message to all other players.
//             io.to(playerId).emit(
//               "chat-message",
//               `Welcome to the group ${playerName} !`,
//               "chat"
//             );
  
//             // * Sending the players name of the host.
//             io.to(playerId).emit(
//               "chat-message",
//               `Host : ${rooms[roomName].host}`,
//               "chat"
//             );
  
//             // * Sending the players name of all members in the room.
//             io.to(playerId).emit(
//               "chat-message",
//               `Members in the room : ${Object.keys(rooms[roomName].players)} !`,
//               "chat"
//             );
  
//             // * Updating the room length.
//             io.in(roomName).emit("set-room-data", rooms[roomName].players);
//           }
//         }
//       } else {
//         socket.emit("roomNotExists");
//       }
//     });
  
//     // * 3.2 Now Chating.
//     socket.on("send-chat-message", (message, playerName, roomName) =>
//       io.in(roomName).emit("chat-message", message, playerName)
//     );
  
//     // to kick a player
//     socket.on("kickPlayer", (sender, kickPlayer, roomName) => {
//       if (sender === rooms[roomName].host) {
//         console.log("kicked");
//         if (rooms[roomName].players[kickPlayer]) {
//           io.to(rooms[roomName].players[kickPlayer].playerId).emit("onKick");
//         }
//       }
//     });
  
//     // * 3.3 GameEnded :
//     socket.on("gameStarted", (playerName, roomName, sentenceText) => {
//       if (playerName == rooms[roomName].host) {
//         rooms[roomName].gameStarted = true;
  
//         for (const x in rooms[roomName].players) {
//           rooms[roomName].players[x].playerFinished = false;
//           rooms[roomName].players[x].playerData = {};
//         }
  
//         io.in(roomName).emit("gameStartedCondition", sentenceText);
//       } else {
//         console.error("A non host player tried to get in the system.");
//       }
//     });
  
//     socket.on("playerFinished", (playerName, roomName, playerData) => {
//       rooms[roomName].players[playerName].playerData = playerData;
//       rooms[roomName].players[playerName].playerFinished = true;
  
//       playersInfo = rooms[roomName].players;
  
//       playersNotFinished = Object.keys(rooms[roomName].players).filter((key) => {
//         return !rooms[roomName].players[key].playerFinished;
//       });
  
//       if (playersNotFinished.length == 0) {
//         rooms[roomName].gameStarted = false;
//         host = rooms[roomName].host;
//         hostId = rooms[roomName].players[host].playerId;
//         if (playersNotFinished == 0 || !currentPlayerRoom.gameStarted)
//           io.to(hostId).emit("showStartButton");
//       }
  
//       io.in(roomName).emit("refreshGraph", rooms[roomName].players);
  
//       // * Sending the join message to all other players.
//       socket.broadcast
//         .in(roomName)
//         .emit("chat-message", `${playerName} finished ! `, "chat");
//     });
//   });
// };
module.exports={app,APIResponse,io};
// module.exports = function(io){

//   io.on('connection', function(socket){

//     socket.on('join room', function(roomname){
//       socket.roomname = roomname;
//       socket.join(roomname);
//     });

//     socket.on('message', function(msg){
//       io.to(socket.roomname).emit('message', msg);
//     });

//   });

// };