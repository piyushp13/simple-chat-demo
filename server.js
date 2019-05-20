const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const socketIo = require('socket.io');
const app = express();
const port = process.env.PORT || 80;

const server = http.createServer(app);
const io = socketIo(server);
const users = [];
let userNumber = 0;

const welcomeMessage =  (userName) => ({message: `Hi! You're connected to the common chat room.`, type: 'text', originalUserName: userName});

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(`${__dirname}/build`));
const broadcastMessage = (message) => {
    io.emit('common-room', message);
};


const handleNewConnection = (socket) => {
    const userName = `user${userNumber++}`;
    console.log('Sending welcome message', userName);
    users.push(userName);
    socket.emit('common-room', welcomeMessage(userName));
    socket.broadcast.emit('common-room', {message: `${userName} connected!`, type: 'text'});
    socket.on('common-room', broadcastMessage);
    socket.on('user-update', (message) => {
        users[users.indexOf(message.originalUserName)] = message.updatedUserName;
        console.log('Updated username from ', message.originalUserName, message.updatedUserName, users);
    });
    socket.on("disconnect", () => {
        console.log(`${userName} disconnected`);
        io.emit('common-room', {message: `${userName} disconnected`, type: 'text', originalUserName: userName});
    });
};

io.on('connection', handleNewConnection);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
