const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try { const top = await User.find().sort({ points: -1 }).limit(10).select('name points badges'); res.json(top); } catch (err) { next(err); }
});

module.exports = router;
