const express = require('express');
const Discussion = require('../models/Discussion');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/:courseId', protect, async (req, res, next) => {
  try {
    const thread = await Discussion.create({ course: req.params.courseId, user: req.user._id, title: req.body.title, body: req.body.body });
    res.status(201).json(thread);
  } catch (err) { next(err); }
});

router.get('/:courseId', protect, async (req, res, next) => {
  try { const threads = await Discussion.find({ course: req.params.courseId }).populate('user','name'); res.json(threads); } catch (err) { next(err); }
});

router.post('/reply/:threadId', protect, async (req, res, next) => {
  try {
    const thread = await Discussion.findById(req.params.threadId);
    thread.replies.push({ user: req.user._id, body: req.body.body });
    await thread.save();
    res.json(thread);
  } catch (err) { next(err); }
});

module.exports = router;
