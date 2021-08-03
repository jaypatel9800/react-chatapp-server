const express = require("express");
const http = require("http");
const cors = require('cors');
const socketio = require("socket.io");
const {addUser, removeUser, getUser, getUsersInRoom} = require('./users');
const router = require("./router");


const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const option = {cors: '*'};
const io = socketio(server, option);

app.use(cors());
app.use(router);

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const {error, user} = addUser({ id:socket.id, name, room });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('massage', {user: 'admin', text: `Hello, ${user.name}. Welcome to the club on room ${user.room}!`})
    socket.broadcast.to(user.room).emit('massage',  {user: 'admin', text : `${user.name} has joined!`});

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMassage', (massage, callback) => {
    const user = getUser(socket.id);
    
    // console.log(socket.id);
    // console.log(typeof(user));
    // console.log(massage);
    io.to(user.room).emit('massage', {user:user.name, text:massage });
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    callback();
  });


  socket.on("left", () => {
    const user = removeUser(socket.id);
    if(user){
      io.to(user.room).emit('massage',{user: 'admin', text: `${user.name} has left!`})
    }
  });
});

server.listen(PORT, () => console.log(`server is started on port ${PORT}`));
