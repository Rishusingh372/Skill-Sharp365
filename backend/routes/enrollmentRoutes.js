const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.post('/:courseId', protect, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    let enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
    if (!enrollment) {
      enrollment = await Enrollment.create({ user: req.user._id, course: course._id, status: 'active', paymentId: req.body.paymentId || 'manual' });
    }
    res.json(enrollment);
  } catch (err) { next(err); }
});

router.get('/my', protect, async (req, res, next) => {
  try { const enrollments = await Enrollment.find({ user: req.user._id }).populate('course'); res.json(enrollments); } catch (err) { next(err); }
});

router.put('/:enrollmentId/progress', protect, async (req, res, next) => {
  try {
    const { progress } = req.body;
    const enrollment = await Enrollment.findById(req.params.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Not found' });
    if (String(enrollment.user) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    enrollment.progress = Math.min(100, Math.max(0, progress));
    await enrollment.save();
    if (enrollment.progress === 100) {
      const user = await User.findById(req.user._id);
      user.points = (user.points || 0) + 100;
      if (!user.badges.includes('Course Completer')) user.badges.push('Course Completer');
      await user.save();
    }
    res.json(enrollment);
  } catch (err) { next(err); }
});

module.exports = router;
