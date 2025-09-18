import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

// For video uploads
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lms_videos",     // Cloudinary folder
    resource_type: "video",   // IMPORTANT for videos
    format: async () => "mp4" // Force MP4 format
  },
});

const videoUpload = multer({ storage: videoStorage });

export default videoUpload;
