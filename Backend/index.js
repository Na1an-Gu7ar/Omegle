const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.userId = userId;
    socket.roomId = roomId;

    const room = io.sockets.adapter.rooms.get(roomId) || new Set();
    const otherUsers = Array.from(room).filter(id => id !== socket.id);
    const initiator = otherUsers.length === 0;

    console.log(`${userId} joined room: ${roomId} as ${initiator ? "initiator" : "responder"}`);
    socket.emit("room-joined", { initiator });

    for (const otherSocketId of otherUsers) {
      const otherSocket = io.sockets.sockets.get(otherSocketId);
      if (otherSocket && otherSocket.userId) {
        socket.emit("user-joined", otherSocket.userId);
        otherSocket.emit("user-joined", userId);
      }
    }
  });

  socket.on("send-signal", ({ to, from, signal }) => {
    const toSocketId = getSocketIdByUserId(to);
    if (toSocketId) {
      io.to(toSocketId).emit("receive-signal", { from, signal });
    }
  });

  socket.on("leave-room", (roomId, userId) => {
    console.log(`${userId} left room: ${roomId}`);
    socket.leave(roomId);
    socket.to(roomId).emit("user-disconnected", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.roomId && socket.userId) {
      socket.to(socket.roomId).emit("user-disconnected", socket.userId);
    }
  });

  const getSocketIdByUserId = (userId) => {
    for (const [id, sock] of io.of("/").sockets) {
      if (sock.userId === userId) return id;
    }
    return null;
  };
});

server.listen(process.env.PORT, () => {
  console.log(`Socket server running on http://localhost:${process.env.PORT}`);
});
