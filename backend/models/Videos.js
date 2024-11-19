const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  originalName: String,
  originalSize: Number,
  compressedSize: Number,
  status: {
    type: String,
    enum: ["uploaded", "processing", "completed"],
    default: "uploaded",
  },
  originalUrl: String,
  compressedUrl: String,
  uploadDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Video", videoSchema);
