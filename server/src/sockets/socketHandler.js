const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join a video room
    socket.on("join-room", (roomId) => {
      if (!roomId) {
        return;
      }

      socket.join(roomId);

      console.log(
        `Socket ${socket.id} joined room ${roomId}`
      );

      // Tell existing users that a new user joined.
      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
      });
    });

    // WebRTC offer
    socket.on("offer", ({ target, offer }) => {
      if (!target || !offer) {
        return;
      }

      io.to(target).emit("offer", {
        sender: socket.id,
        offer,
      });
    });

    // WebRTC answer
    socket.on("answer", ({ target, answer }) => {
      if (!target || !answer) {
        return;
      }

      io.to(target).emit("answer", {
        sender: socket.id,
        answer,
      });
    });

    // ICE candidate
    socket.on(
      "ice-candidate",
      ({ target, candidate }) => {
        if (!target || !candidate) {
          return;
        }

        io.to(target).emit("ice-candidate", {
          sender: socket.id,
          candidate,
        });
      }
    );

    // Disconnect
    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];

      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("user-left", {
            socketId: socket.id,
          });
        }
      });
    });

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.id
      );
    });
  });
};

module.exports = registerSocketHandlers;