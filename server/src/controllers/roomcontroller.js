const crypto = require("crypto");

const Room = require("../models/Room");

const createRoom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Room name is required",
      });
    }

    const roomId = crypto.randomBytes(6).toString("hex");

    const room = await Room.create({
      name: name.trim(),
      roomId,
      createdBy: req.userId,
    });

    return res.status(201).json({
      message: "Room created successfully",
      room: {
        id: room._id,
        name: room.name,
        roomId: room.roomId,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error("Create room error:", error);

    return res.status(500).json({
      message: "Unable to create room",
    });
  }
};

const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({
      roomId,
    }).populate(
      "createdBy",
      "name email"
    );

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    return res.status(200).json({
      room,
    });
  } catch (error) {
    console.error("Get room error:", error);

    return res.status(500).json({
      message: "Unable to get room",
    });
  }
};

module.exports = {
  createRoom,
  getRoom,
};