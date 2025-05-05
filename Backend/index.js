const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL, // In production, restrict this
  methods: ["GET", "POST"],
  credentials: true,
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // In production, restrict this
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const rooms = {}; // roomId => [socket.id]

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.userId = userId;
    socket.roomId = roomId;

    console.log(`${userId} joined room: ${roomId}`);

    // Notify others in the room (except this socket)
    socket.to(roomId).emit("user-joined", userId);
  });

  socket.on("send-signal", ({ to, from, signal }) => {
    // Relay the signal to the intended recipient
    io.to(getSocketIdByUserId(to)).emit("receive-signal", { from, signal });
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
