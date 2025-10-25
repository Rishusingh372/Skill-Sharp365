const express = require('express');
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } else {
    console.warn('STRIPE_SECRET_KEY not found in environment variables. Stripe features will be disabled.');
    stripe = null;
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
  stripe = null;
}
const { authMiddleware } = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

// ✅ CREATE CHECKOUT SESSION
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message: 'Payment service is not available'
            });
        }

        const { courseId } = req.body;

        console.log('Creating checkout session for course:', courseId, 'user:', req.user._id);

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

        console.log('Stripe session created:', session.id);

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

        console.log('Verifying payment for session:', sessionId);

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

            console.log('Payment verified, enrolling user:', payment.user);

            // Enroll user in course
            const user = await User.findById(payment.user);
            const isEnrolled = user.enrolledCourses.some(
                enrolled => enrolled.course.toString() === payment.course.toString()
            );

            if (!isEnrolled) {
                user.enrolledCourses.push({
                    course: payment.course,
                    enrolledAt: new Date(),
                    progress: {
                        completedLessons: [],
                        lastAccessed: new Date(),
                        completionPercentage: 0
                    }
                });
                await user.save();
                console.log('User enrolled successfully');
            }

            // Update course student count
            await Course.findByIdAndUpdate(payment.course, {
                $addToSet: { studentsEnrolled: payment.user },
                $inc: { totalStudents: 1 }
            });

            console.log('Course student count updated');

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

// ✅ REQUEST REFUND
router.post('/:paymentId/refund', authMiddleware, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;

        console.log('Processing refund request for payment:', paymentId);

        // Find payment record
        const payment = await Payment.findById(paymentId)
            .populate('user', 'name email')
            .populate('course', 'title instructor');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Check if user owns this payment
        if (payment.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only request refunds for your own payments.'
            });
        }

        // Check if payment is eligible for refund
        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Only completed payments can be refunded'
            });
        }

        // Check refund window (30 days)
        const paymentDate = new Date(payment.createdAt);
        const daysSincePurchase = Math.floor((Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSincePurchase > 30) {
            return res.status(400).json({
                success: false,
                message: 'Refund requests must be made within 30 days of purchase'
            });
        }

        // Check if already refunded
        if (payment.status === 'refunded') {
            return res.status(400).json({
                success: false,
                message: 'This payment has already been refunded'
            });
        }

        // Process refund with Stripe
        const refund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentId,
            amount: payment.amount, // Full refund
            reason: 'requested_by_customer',
            metadata: {
                paymentId: payment._id.toString(),
                reason: reason || 'Customer requested refund'
            }
        });

        // Update payment record
        payment.status = 'refunded';
        payment.refundReason = reason || 'Customer requested refund';
        await payment.save();

        // Remove user from course enrollment
        const user = await User.findById(payment.user._id);
        user.enrolledCourses = user.enrolledCourses.filter(
            enrolled => enrolled.course.toString() !== payment.course._id.toString()
        );
        await user.save();

        // Update course student count
        await Course.findByIdAndUpdate(payment.course._id, {
            $pull: { studentsEnrolled: payment.user._id },
            $inc: { totalStudents: -1 }
        });

        // Send refund confirmation email
        try {
            await sendEmail(
                user.email,
                'refundConfirmation',
                [user, payment.course, payment, payment.amount]
            );
            console.log('Refund confirmation email sent');
        } catch (emailError) {
            console.error('Failed to send refund confirmation email:', emailError);
        }

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refund: {
                id: refund.id,
                amount: refund.amount,
                status: refund.status
            }
        });

    } catch (error) {
        console.error('Refund processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing refund',
            error: error.message
        });
    }
});

// ✅ GET REFUND ELIGIBILITY
router.get('/:paymentId/refund-eligibility', authMiddleware, async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Check if user owns this payment
        if (payment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check eligibility
        const isCompleted = payment.status === 'completed';
        const paymentDate = new Date(payment.createdAt);
        const daysSincePurchase = Math.floor((Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        const withinRefundWindow = daysSincePurchase <= 30;
        const notAlreadyRefunded = payment.status !== 'refunded';

        const eligible = isCompleted && withinRefundWindow && notAlreadyRefunded;

        res.json({
            success: true,
            eligible,
            reasons: {
                notCompleted: !isCompleted,
                outsideRefundWindow: !withinRefundWindow,
                alreadyRefunded: !notAlreadyRefunded
            },
            daysSincePurchase,
            refundDeadline: new Date(paymentDate.getTime() + (30 * 24 * 60 * 60 * 1000))
        });

    } catch (error) {
        console.error('Refund eligibility check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking refund eligibility',
            error: error.message
        });
    }
});

// ✅ GET ENHANCED PAYMENT HISTORY WITH FILTERS
router.get('/history/enhanced', authMiddleware, async (req, res) => {
    try {
        const { status, startDate, endDate, courseId, page = 1, limit = 10 } = req.query;

        let query = { user: req.user._id };

        // Apply filters
        if (status) {
            query.status = status;
        }

        if (courseId) {
            query.course = courseId;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const payments = await Payment.find(query)
            .populate('course', 'title thumbnail instructor price category')
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);

        // Calculate summary statistics
        const summary = await Payment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalPayments: { $sum: 1 },
                    completedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    refundedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            payments: payments.map(payment => ({
                id: payment._id,
                amount: payment.amount,
                status: payment.status,
                createdAt: payment.createdAt,
                receiptUrl: payment.receiptUrl,
                refundReason: payment.refundReason,
                course: payment.course,
                formattedAmount: `$${(payment.amount / 100).toFixed(2)}`
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            summary: summary[0] || {
                totalAmount: 0,
                totalPayments: 0,
                completedPayments: 0,
                refundedPayments: 0
            }
        });

    } catch (error) {
        console.error('Enhanced payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching enhanced payment history',
            error: error.message
        });
    }
});

// ✅ GET INSTRUCTOR ANALYTICS
router.get('/instructor/analytics', authMiddleware, async (req, res) => {
    try {
        // Only instructors and admin can access
        if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Instructor role required'
            });
        }

        const { period = '30d' } = req.query;

        // Calculate date range
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get earnings data
        const earningsData = await Payment.aggregate([
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
                    createdAt: { $gte: startDate }
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
                    dailySales: { $sum: 1 },
                    courses: { $addToSet: '$course._id' }
                }
            },
            {
                $project: {
                    date: {
                        $dateFromParts: {
                            year: '$_id.year',
                            month: '$_id.month',
                            day: '$_id.day'
                        }
                    },
                    earnings: '$dailyEarnings',
                    sales: '$dailySales',
                    uniqueCourses: { $size: '$courses' }
                }
            },
            { $sort: { date: 1 } }
        ]);

        // Get top performing courses
        const topCourses = await Payment.aggregate([
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
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$course._id',
                    title: { $first: '$course.title' },
                    totalEarnings: { $sum: '$amount' },
                    totalSales: { $sum: 1 }
                }
            },
            {
                $project: {
                    courseId: '$_id',
                    title: 1,
                    totalEarnings: 1,
                    totalSales: 1,
                    averagePrice: { $divide: ['$totalEarnings', '$totalSales'] }
                }
            },
            { $sort: { totalEarnings: -1 } },
            { $limit: 10 }
        ]);

        // Get overall statistics
        const overallStats = await Payment.aggregate([
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
                    averageSale: { $avg: '$amount' },
                    uniqueStudents: { $addToSet: '$user' },
                    uniqueCourses: { $addToSet: '$course._id' }
                }
            },
            {
                $project: {
                    totalEarnings: 1,
                    totalSales: 1,
                    averageSale: 1,
                    totalStudents: { $size: '$uniqueStudents' },
                    totalCourses: { $size: '$uniqueCourses' }
                }
            }
        ]);

        res.json({
            success: true,
            period,
            earningsData,
            topCourses,
            overallStats: overallStats[0] || {
                totalEarnings: 0,
                totalSales: 0,
                averageSale: 0,
                totalStudents: 0,
                totalCourses: 0
            }
        });

    } catch (error) {
        console.error('Instructor analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructor analytics',
            error: error.message
        });
    }
});

// ✅ FIX: Export the router
module.exports = router;