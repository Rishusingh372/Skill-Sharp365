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
const Payment = require('../models/Payment');
const User = require('../models/User');
const Course = require('../models/Course');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ error: 'Payment service is not available' });
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;

            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'charge.dispute.created':
                await handleChargeDispute(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
    console.log('Processing checkout.session.completed:', session.id);

    try {
        // Find payment record
        const payment = await Payment.findOne({
            stripePaymentId: session.payment_intent
        }).populate('user course');

        if (!payment) {
            console.error('Payment record not found for session:', session.id);
            return;
        }

        if (payment.status === 'completed') {
            console.log('Payment already processed');
            return;
        }

        // Update payment status
        payment.status = 'completed';
        payment.receiptUrl = session.payment_intent.charges.data[0]?.receipt_url;
        await payment.save();

        // Enroll user in course
        const user = await User.findById(payment.user);
        const isEnrolled = user.enrolledCourses.some(
            enrolled => enrolled.course.toString() === payment.course._id.toString()
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
            console.log('User enrolled successfully via webhook');
        }

        // Update course student count
        await Course.findByIdAndUpdate(payment.course, {
            $addToSet: { studentsEnrolled: payment.user },
            $inc: { totalStudents: 1 }
        });

        // Send confirmation email
        try {
            await sendEmail(
                user.email,
                'purchaseConfirmation',
                [user, payment.course, payment]
            );
            console.log('Confirmation email sent');
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
        }

    } catch (error) {
        console.error('Error processing checkout session:', error);
    }
}

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log('Payment intent succeeded:', paymentIntent.id);

    try {
        const payment = await Payment.findOne({ stripePaymentId: paymentIntent.id });

        if (payment && payment.status !== 'completed') {
            payment.status = 'completed';
            payment.receiptUrl = paymentIntent.charges.data[0]?.receipt_url;
            await payment.save();
            console.log('Payment status updated to completed');
        }
    } catch (error) {
        console.error('Error handling payment intent succeeded:', error);
    }
}

// Handle payment intent failed
async function handlePaymentIntentFailed(paymentIntent) {
    console.log('Payment intent failed:', paymentIntent.id);

    try {
        const payment = await Payment.findOne({ stripePaymentId: paymentIntent.id });

        if (payment) {
            payment.status = 'failed';
            await payment.save();
            console.log('Payment status updated to failed');
        }
    } catch (error) {
        console.error('Error handling payment intent failed:', error);
    }
}

// Handle charge dispute
async function handleChargeDispute(dispute) {
    console.log('Charge dispute created:', dispute.id);

    try {
        // Find payment by charge ID
        const payment = await Payment.findOne({
            stripePaymentId: dispute.payment_intent
        }).populate('user course');

        if (payment) {
            // Notify admin about dispute (you might want to send an email or create a notification)
            console.log('Dispute created for payment:', payment._id, 'Amount:', dispute.amount);

            // You could add dispute handling logic here
            // For example, mark payment as disputed, notify instructor, etc.
        }
    } catch (error) {
        console.error('Error handling charge dispute:', error);
    }
}

module.exports = router;
