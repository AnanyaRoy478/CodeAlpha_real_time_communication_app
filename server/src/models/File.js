const fileSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },

    url: String,
  },
  {
    timestamps: true,
  }
);