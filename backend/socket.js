import { Server } from "socket.io";

let io;

export const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // Join a room for targeted events (e.g., teacher's email)
    socket.on("join-room", (roomName) => {
      socket.join(roomName);
      console.log(`[SOCKET] User ${socket.id} joined room: ${roomName}`);
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
