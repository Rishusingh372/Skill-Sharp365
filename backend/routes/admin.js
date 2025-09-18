import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// List unapproved courses
router.get('/pending-courses', protect, authorize('admin'), async (req, res) => {
  try {
    const courses = await Course.find({ approved: false }).populate('teacher', 'name email');
    res.json(courses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Approve course
router.post('/approve-course/:courseId', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.approved = true;
    await course.save();
    res.json({ message: 'Course approved' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Promote user to teacher (example admin action)
router.post('/promote/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = 'teacher';
    await user.save();
    res.json({ message: 'User promoted to teacher' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
