const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Real-Time Communication API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

module.exports = app;