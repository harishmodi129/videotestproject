import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "./UploadVideo.css";

const UploadVideo = () => {
  const [video, setVideo] = useState(null);
  const [uploadId, setUploadId] = useState(null);
  const [status, setStatus] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [loading, setLoading] = useState(false); // For upload
  const [compressing, setCompressing] = useState(false); // For compression

  const handleFileChange = (e) => {
    setVideo(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!video) {
      toast.error("Please select a video to upload.");
      return;
    }

    setLoading(true); // Set loading to true before making the request
    const formData = new FormData();
    formData.append("video", video);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/videos/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Check if the response contains an uploadId
      if (response.data.uploadId) {
        toast.success("Video uploaded successfully!");
        setUploadId(response.data.uploadId);
        setStatus("uploaded");
      } else {
        toast.error("Failed to upload the video.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading video.");
    } finally {
      setLoading(false); // Reset loading state after the request is done
    }
  };

  const handleCompress = async () => {
    if (!uploadId) {
      toast.error("No video to compress. Upload a video first.");
      return;
    }

    setCompressing(true); // Set compressing state to true
    try {
      const response = await axios.post(
        `http://localhost:5000/api/videos/compress/${uploadId}`
      );
      toast.info("Compression started. Please wait...");
      setStatus("processing");
    } catch (error) {
      console.error(error);
      toast.error("Error starting compression.");
    } finally {
      setCompressing(false); // Reset compressing state after the request is done
    }
  };

  const checkStatus = async () => {
    if (!uploadId) {
      toast.error("No video to check status for.");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/videos/status/${uploadId}`
      );
      const { status, downloadLink } = response.data;
      console.log(response.data);

      setStatus(status);

      if (status === "completed") {
        toast.success("Compression completed!");
        // setDownloadLink(downloadLink?.compressed);
        setDownloadLink(downloadLink);
      } else {
        toast.info("Compression still in progress...");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching compression status.");
    }
  };

  return (
    <div>
      <ToastContainer />

      <div>
        <label htmlFor="video-upload">Upload a video:</label>
        <input
          type="file"
          id="video-upload"
          accept="video/*"
          onChange={handleFileChange}
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload Video"}
        </button>
        <button
          onClick={handleCompress}
          disabled={!uploadId || status === "processing" || compressing}
        >
          {compressing ? "Compressing..." : "Compress Video"}
        </button>
        <button onClick={checkStatus} disabled={!uploadId}>
          Check Status
        </button>
      </div>

      {status && <p>Status: {status}</p>}

      {downloadLink && (
        <div>
          <p>Download your compressed video:</p>
          <a href={downloadLink} download>
            <button>Download Compressed Video</button>
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadVideo;
