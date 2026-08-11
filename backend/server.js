const express = require("express");
const http = require("http");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const { createSocketServer } = require("./socket");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const testCaseRoutes = require("./routes/testCaseRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const systemRoutes = require("./routes/systemRoutes");
const { apiLimiter } = require("./middleware/rateLimitMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "TestFlow API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/testcases", testCaseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/system", systemRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

createSocketServer(server);

server.listen(PORT, () => {
  console.log(`TestFlow API running on port ${PORT}`);
});
