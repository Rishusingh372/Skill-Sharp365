const express = require('express');
const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, async (req, res, next) => {
  try {
    if (!['instructor','admin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    const quiz = await Quiz.create(req.body);
    res.status(201).json(quiz);
  } catch (err) { next(err); }
});

router.get('/course/:courseId', protect, async (req, res, next) => {
  try { const quizzes = await Quiz.find({ course: req.params.courseId }); res.json(quizzes); } catch (err) { next(err); }
});

router.post('/submit/:quizId', protect, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const answers = req.body.answers || [];
    let correct = 0;
    quiz.questions.forEach((q,i)=> { if (answers[i] === q.correctIndex) correct++; });
    const scorePercent = Math.round((correct / quiz.questions.length) * 100);
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: quiz.course });
    if (enrollment) {
      enrollment.progress = Math.min(100, enrollment.progress + 10);
      if (scorePercent >= quiz.passingScorePercent) {
        const user = await User.findById(req.user._id);
        user.points = (user.points || 0) + 50;
        if (user.points >= 500 && !user.badges.includes('Bronze Learner')) user.badges.push('Bronze Learner');
        await user.save();
      }
      await enrollment.save();
    }
    res.json({ scorePercent, correct, total: quiz.questions.length, progress: enrollment ? enrollment.progress : 0 });
  } catch (err) { next(err); }
});

module.exports = router;
