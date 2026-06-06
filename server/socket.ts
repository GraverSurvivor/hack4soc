import { createServer } from "http";
import { Server } from "socket.io";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join-classroom", (classroomId: string) => {
    socket.join(`classroom-${classroomId}`);
  });

  socket.on("leave-classroom", (classroomId: string) => {
    socket.leave(`classroom-${classroomId}`);
  });

  socket.on("new-message", (data: { classroomId: string; message: unknown }) => {
    io.to(`classroom-${data.classroomId}`).emit("message", data.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
