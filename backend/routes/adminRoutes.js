const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/overview', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const usersCount = await User.countDocuments();
    const coursesCount = await Course.countDocuments();
    const enrollmentsCount = await Enrollment.countDocuments();
    const completions = await Enrollment.countDocuments({ progress: 100 });
    res.json({ usersCount, coursesCount, enrollmentsCount, completions });
  } catch (err) { next(err); }
});

module.exports = router;
