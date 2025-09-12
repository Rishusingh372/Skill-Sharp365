const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const router = express.Router();

// const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

router.post('/order/:courseId', protect, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const options = { amount: course.price * 100, currency: 'INR', receipt: `rcpt_${Date.now()}` };
    const order = await razorpay.orders.create(options);
    res.json({ order, course });
  } catch (err) { next(err); }
});

router.post('/verify', protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');
    if (expectedSignature !== razorpay_signature) return res.status(400).json({ message: 'Invalid signature' });
    const enrollment = await Enrollment.create({ user: req.user._id, course: courseId, status: 'active', paymentId: razorpay_payment_id });
    res.json({ message: 'Payment verified', enrollment });
  } catch (err) { next(err); }
});

module.exports = router;
