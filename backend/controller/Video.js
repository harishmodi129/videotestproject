const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const s3 = require("../config/awsconfig");
const Video = require("../models/Videos");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Multer setup
const upload = multer({ dest: "uploads/" });

// Upload video
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const file = req.file;

    // Upload original file to S3
    const originalFileStream = fs.createReadStream(file.path);
    const originalParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `original/${file.filename}-${file.originalname}`,
      Body: originalFileStream,
    };

    const originalUpload = await s3.upload(originalParams).promise();

    // Save metadata in MongoDB
    const video = new Video({
      originalName: file.originalname,
      originalSize: file.size,
      originalUrl: originalUpload.Location,
      status: "uploaded",
    });
    await video.save();

    // Remove file from local storage
    fs.unlinkSync(file.path);

    res
      .status(200)
      .json({ message: "Video uploaded successfully", uploadId: video._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error uploading video" });
  }
});

// Compress video
router.post("/compress/:id", async (req, res) => {
  try {
    const ffmpegPath = "D:\\ffmpeg-7.1-essentials_build\\bin\\ffmpeg.exe";
    ffmpeg.setFfmpegPath(ffmpegPath);

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    video.status = "processing";
    await video.save();

    const outputPath = `uploads/compressed-${Date.now()}.mp4`;

    ffmpeg(video.originalUrl)
      .output(outputPath)
      .videoCodec("libx264")
      .size("50%") // Reduce video size by 50%
      .on("end", async () => {
        // Upload compressed file to S3
        const compressedFileStream = fs.createReadStream(outputPath);
        const compressedParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `compressed/${path.basename(outputPath)}`,
          Body: compressedFileStream,
        };

        const compressedUpload = await s3.upload(compressedParams).promise();

        // Update video metadata in MongoDB
        const stats = fs.statSync(outputPath);
        video.compressedSize = stats.size;
        video.compressedUrl = compressedUpload.Location;
        video.status = "completed";
        await video.save();

        // Remove compressed file from local storage
        fs.unlinkSync(outputPath);

        res
          .status(200)
          .json({ message: "Video compressed successfully", video });
      })
      .on("error", (err) => {
        console.error(err);
        video.status = "uploaded";
        video.save();
        res.status(500).json({ error: "Error compressing video" });
      })
      .run();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error compressing video" });
  }
});

// Get video status
router.get("/status/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // res.status(200).json(video);
    res.status(200).json({
      status: video.status,
      downloadLink: video.compressedUrl || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching video status" });
  }
});

// Export router
module.exports = router;
