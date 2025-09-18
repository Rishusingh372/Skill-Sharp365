import express from "express";
const router = express.Router();
import videoUpload from "../utils/multer.js";
import Course from "../models/Course.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import slugify from "slugify";

// ✅ Create a new course (Teacher/Admin only)
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!title || title.trim() === '') {
        return res.status(400).json({ message: "Title is required" });
      }
      const slug = slugify(title, { lower: true }) + '-' + Date.now().toString().slice(-4);

      const course = new Course({
        title,
        slug,
        description,
        teacher: req.user._id, // store teacher/admin who created
      });

      await course.save();
      res.status(201).json({ message: "Course created successfully", course });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create course" });
    }
  }
);

// ✅ Upload a video to a course (Teacher/Admin only)
router.post(
  "/:courseId/upload-video",
  protect,
  authorize("teacher", "admin"),
  videoUpload.single("video"),
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      if (!req.file) {
        return res.status(400).json({ message: "Video file is required" });
      }
      const videoUrl = req.file.path; // Cloudinary URL

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      // Add video to course's lectures array
      course.lectures.push({
        title: req.body.title || "Untitled Lecture",
        videoUrl: videoUrl,
      });

      await course.save();
      res.json({ message: "Video uploaded successfully", videoUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Video upload failed" });
    }
  }
);

// ✅ Get all courses (Public - students can view)
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().select("title description createdAt");
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// ✅ Get course details by ID (Public - students can view)
router.get("/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch course" });
  }
});

export default router;
