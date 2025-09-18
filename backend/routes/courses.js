import express from 'express';
import Course from '../models/Course.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import slugify from 'slugify';
import User from '../models/User.js';

const router = express.Router();

// Create course (teacher only)
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { title, description, category, price, thumbnail } = req.body;
    const slug = slugify(title, { lower: true }) + '-' + Date.now().toString().slice(-4);
    const course = await Course.create({ title, slug, description, category, price, thumbnail, teacher: req.user._id });
    res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add lecture to course (teacher only, owner)
router.post('/:courseId/lectures', protect, authorize('teacher'), async (req, res) => {
  try {
    const { title, videoUrl, duration, resources } = req.body;
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.teacher.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not allowed' });
    const lecture = { title, videoUrl, duration, resources };
    course.lectures.push(lecture);
    await course.save();
    res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Enroll in course (student)
router.post('/:courseId/enroll', protect, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.studentsEnrolled.includes(req.user._id)) return res.status(400).json({ message: 'Already enrolled' });
    course.studentsEnrolled.push(req.user._id);
    await course.save();
    const user = await User.findById(req.user._id);
    user.enrolledCourses.push(course._id);
    await user.save();
    res.json({ message: 'Enrolled successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get public courses (pagination & filter optional)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, q } = req.query;
    const filter = { approved: true };
    if (q) filter.$text = { $search: q };
    const courses = await Course.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('teacher', 'name email');
    res.json(courses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get course by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug }).populate('teacher', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
