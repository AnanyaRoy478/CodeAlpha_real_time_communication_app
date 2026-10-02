const express = require("express");

const {
  createRoom,
  getRoom,
} = require("../controllers/roomController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createRoom);

router.get("/:roomId", protect, getRoom);

module.exports = router;