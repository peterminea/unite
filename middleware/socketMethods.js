const {
  generateMessage,
  generateSimpleMessage,
  generateLocationMessage
} = require("../middleware/chatMessages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("../middleware/chatUsers");


const BadWords = require("bad-words");
const Message = require("../models/message");
let count = 0;

const socketMethods = (socket, sock) => {
  console.log("User connected!");
  sock.emit("countUpdated", count);

  sock.on("join", (obj, callback) => {
    console.log("New WebSocket Connection: " + obj.username);

    let { error, user } = addUser({
      id: sock.id,
      username: obj.username,
      room: obj.room
    }); //..options
    console.log(sock.id + " " + JSON.stringify(user) + " " + error);
    if (!user) {
      user = {
        id: sock.id,
        username: "User",
        room: "Chamberroom"
      };
    }

    if (error) {
      return callback(error);
    }

    sock.join(user.room);
    let msg = generateSimpleMessage("Admin", "Welcome to the UNITE chat!");
    sock.emit("message", msg);
    let users = getUsersInRoom(user.room);
    console.log(users.length + " " + users[0].username);
    socket.to(user.room).emit("roomData", {
      room: user.room,
      users: users
    });

    msg = generateSimpleMessage(
      "Admin",
      "We have a new user, " + user.username + ", that has joined us in Chat!"
    );
    console.log(msg.username);
    sock.broadcast.to(user.room).emit("message", msg);

    callback();
  });

  sock.on("increment", () => {
    count++;
    //sock.emit('countUpdated', count);//Particularly
    socket.emit("countUpdated", count); //Globally
  });

  sock.on("disconnect", function() {
    console.log("User disconnected!");
    let user = removeUser(sock.id);
    console.log(JSON.stringify(user));
    if (user) {
      socket
        .to(user.room)
        .emit(
          "message",
          generateSimpleMessage("Admin", `${user.username} has just left us!`)
        );
      socket.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });

  sock.on("stopTyping", () => {
    sock.broadcast.emit("notifyStopTyping");
  });

  sock.on("sendMessage", function(msgData, callback) {
    let user = getUser(sock.id);

    if (!user) {
      user = {
        id: sock.id,
        username: "User",
        room: "Chamberroom"
      };
    }

    msgData.time = new Date().getTime(); //dateformat(new Date(), 'dddd, mmmm dS, yyyy, h:MM:ss TT');

    sock.broadcast.emit("received", {
      message: msgData.message
    });

    const filter = new BadWords();
    if (filter.isProfane(msgData.message)) {
      return callback(
        console.log(
          "Please be careful with the words you use. Delivery failed. Thank you for understanding!"
        )
      );
    }

    let mesg = new Message(msgData);

    mesg.save(err => {
      if (err) {
        console.error(err.message);
        throw err;
      }
    });
    
    console.log(callback);
    socket
      .to(user.room)
      .emit("message", generateMessage(user.username, msgData));
    if (typeof callback !== "undefined") callback();
  });

  sock.on("sendLocation", (coords, callback) => {
    console.log(coords);
    let user = getUser(sock.id);
    if (!user) {
      user = {
        id: sock.id,
        username: "User",
        room: "Chamberroom"
      };
    }

    socket
      .to(user.room)
      .emit(
        "locationMessage",
        generateLocationMessage(
          user.username,
          `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
        )
      );
    console.log(
      "https://www.google.com/maps?q=" +
        coords.latitude +
        "," +
        coords.longitude +
        ""
    );
    callback();
  });

  sock.on("typing", data => {
    let user = getUser(sock.id);
    if (!user) {
      user = {
        id: sock.id,
        username: "User",
        room: "Chamberroom"
      };
    }
    sock.broadcast
      .to(user.room)
      .emit(
        "notifyTyping",
        generateSimpleMessage("Admin", `${user.username} is typing...`)
      );
  });
}

module.exports = { socketMethods };