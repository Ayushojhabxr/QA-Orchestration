const { Server } = require("socket.io");
const User = require("./models/User");
const { initializeRealtime } = require("./services/realtimeService");
const { verifyAccessToken } = require("./utils/tokens");

const createSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select("name email role");

      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { user } = socket;
    socket.join(`user:${user._id}`);
    socket.join(`role:${user.role}`);

    socket.on("watch:project", (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on("watch:testcase", (testCaseId) => {
      if (testCaseId) {
        socket.join(`testcase:${testCaseId}`);
      }
    });

    socket.on("unwatch:project", (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on("unwatch:testcase", (testCaseId) => {
      if (testCaseId) {
        socket.leave(`testcase:${testCaseId}`);
      }
    });
  });

  initializeRealtime(io);
  return io;
};

module.exports = { createSocketServer };
