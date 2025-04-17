"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var express = require('express');
var socket_io_1 = require("socket.io");
var UserManager_1 = require("./managers/UserManager");
var app = express();
var server = http.createServer(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
var userManager = new UserManager_1.UserManager();
io.on('connection', function (socket) {
    console.log('a user connected');
    userManager.addUser(socket, "randomName");
    socket.on('disconnect', function () {
        console.log('user disconnected');
        userManager.removeUser(socket.id);
    });
});
server.listen(3000, function () {
    console.log('server running at http://localhost:3000');
});
