"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var express_1 = require("express");
var socket_io_1 = require("socket.io");
var UserManager_1 = require("./managers/UserManager");
var app = (0, express_1.default)();
var server = http_1.default.createServer(app);
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
