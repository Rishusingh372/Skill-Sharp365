const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authMiddleware } = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const User = require('../models/User');

const router = express.Router();

// ✅ CREATE CHECKOUT SESSION
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.body;

        // Validate course exists and is published
        const course = await Course.findOne({ 
            _id: courseId, 
            isPublished: true 
        }).populate('instructor', 'name');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found or not published'
            });
        }

        // Check if user is already enrolled
        const user = await User.findById(req.user._id);
        const isEnrolled = user.enrolledCourses.some(
            enrolled => enrolled.course.toString() === courseId
        );

        if (isEnrolled) {
            return res.status(400).json({
                success: false,
                message: 'You are already enrolled in this course'
            });
        }

        // Check if user is trying to buy their own course
        if (course.instructor._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot purchase your own course'
            });
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                    userId: user._id.toString()
                }
            });
            customerId = customer.id;
            
            // Save customer ID to user
            user.stripeCustomerId = customerId;
            await user.save();
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: course.title,
                            description: course.shortDescription || course.description.substring(0, 200),
                            images: [course.thumbnail],
                            metadata: {
                                courseId: course._id.toString()
                            }
                        },
                        unit_amount: Math.round(course.price * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/courses/${courseId}?payment=cancelled`,
            customer_email: user.email,
            client_reference_id: course._id.toString(),
            metadata: {
                userId: user._id.toString(),
                courseId: course._id.toString(),
                instructorId: course.instructor._id.toString()
            },
            payment_intent_data: {
                metadata: {
                    userId: user._id.toString(),
                    courseId: course._id.toString(),
                    instructorId: course.instructor._id.toString()
                }
            },
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
        });

        // Create payment record in database
        await Payment.create({
            user: user._id,
            course: course._id,
            amount: course.price * 100, // Store in cents
            stripePaymentId: session.payment_intent,
            stripeCustomerId: customerId,
            status: 'pending'
        });

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating checkout session',
            error: error.message
        });
    }
});

// ✅ VERIFY PAYMENT (Frontend confirmation)
router.post('/verify', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.body;

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent']
        });

        if (session.payment_status === 'paid') {
            const paymentIntent = session.payment_intent;
            
            // Find and update payment record
            const payment = await Payment.findOne({ 
                stripePaymentId: paymentIntent.id 
            });

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment record not found'
                });
            }

            if (payment.status === 'completed') {
                return res.json({
                    success: true,
                    message: 'Payment already verified',
                    payment
                });
            }

            // Update payment status
            payment.status = 'completed';
            payment.receiptUrl = paymentIntent.charges.data[0].receipt_url;
            await payment.save();

            // Enroll user in course
            const user = await User.findById(payment.user);
            const isEnrolled = user.enrolledCourses.some(
                enrolled => enrolled.course.toString() === payment.course.toString()
            );

            if (!isEnrolled) {
                user.enrolledCourses.push({
                    course: payment.course,
                    enrolledAt: new Date()
                });
                await user.save();
            }

            // Update course student count
            await Course.findByIdAndUpdate(payment.course, {
                $addToSet: { studentsEnrolled: payment.user },
                $inc: { totalStudents: 1 }
            });

            res.json({
                success: true,
                message: 'Payment verified successfully',
                payment: {
                    id: payment._id,
                    amount: payment.amount,
                    status: payment.status,
                    course: payment.course,
                    receiptUrl: payment.receiptUrl
                }
            });

        } else {
            res.status(400).json({
                success: false,
                message: 'Payment not completed',
                paymentStatus: session.payment_status
            });
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
});

// ✅ GET PAYMENT HISTORY (User's payments)
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate('course', 'title thumbnail instructor price')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            payments: payments.map(payment => ({
                id: payment._id,
                amount: payment.amount,
                status: payment.status,
                createdAt: payment.createdAt,
                receiptUrl: payment.receiptUrl,
                course: payment.course
            }))
        });

    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment history',
            error: error.message
        });
    }
});

// ✅ GET PAYMENT DETAILS
router.get('/:paymentId', authMiddleware, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId)
            .populate('course', 'title thumbnail instructor')
            .populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Check if user owns this payment or is admin
        if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            payment
        });

    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment details',
            error: error.message
        });
    }
});

// ✅ GET INSTRUCTOR EARNINGS
router.get('/instructor/earnings', authMiddleware, async (req, res) => {
    try {
        // Only instructors and admin can access
        if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Instructor role required'
            });
        }

        const payments = await Payment.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            {
                $match: {
                    'course.instructor': req.user._id,
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$amount' },
                    totalSales: { $sum: 1 },
                    averageSale: { $avg: '$amount' }
                }
            }
        ]);

        const monthlyEarnings = await Payment.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            {
                $match: {
                    'course.instructor': req.user._id,
                    status: 'completed',
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    dailyEarnings: { $sum: '$amount' },
                    dailySales: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
            { $limit: 30 }
        ]);

        res.json({
            success: true,
            earnings: payments[0] || { totalEarnings: 0, totalSales: 0, averageSale: 0 },
            monthlyEarnings
        });

    } catch (error) {
        console.error('Earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching earnings',
            error: error.message
        });
    }
});

module.exports = router;