import * as http from 'http'
import { Socket } from 'socket.io';
const express = require('express');
import { Server } from 'socket.io';
import { UserManager } from './managers/UserManager';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const userManager = new UserManager()

io.on('connection', (socket: Socket) => {
  console.log('a user connected');
  userManager.addUser(socket, "randomName")
  socket.on('disconnect', () => {
    console.log('user disconnected');
    userManager.removeUser(socket.id)
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});