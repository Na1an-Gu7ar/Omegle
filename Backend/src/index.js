"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require('http');
var express = require('express');
var socket_io_1 = require("socket.io");
var app = express();
var server = http.createServer(http);
var io = new socket_io_1.Server(server);
io.on('connection', function (socket) {
    console.log('a user connected');
});
server.listen(3000, function () {
    console.log('server running at http://localhost:3000');
});
