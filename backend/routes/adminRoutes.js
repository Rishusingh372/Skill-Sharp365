const express = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// ✅ GET PLATFORM STATISTICS
router.get('/stats', async (req, res) => {
    try {
        // Get total users count (excluding admins)
        const totalUsers = await User.countDocuments({ 
            role: { $in: ['student', 'instructor'] } 
        });

        // Get total students count
        const totalStudents = await User.countDocuments({ role: 'student' });

        // Get total instructors count
        const totalInstructors = await User.countDocuments({ role: 'instructor' });

        // Get total courses count
        const totalCourses = await Course.countDocuments();

        // Get published courses count
        const publishedCourses = await Course.countDocuments({ isPublished: true });

        // Get pending courses (unpublished)
        const pendingCourses = await Course.countDocuments({ isPublished: false });

        // Get total revenue from completed payments
        const revenueResult = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]);

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        // Get total payments count
        const totalPayments = await Payment.countDocuments({ status: 'completed' });

        // Get recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
            role: { $in: ['student', 'instructor'] }
        });

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalStudents,
                totalInstructors,
                totalCourses,
                publishedCourses,
                pendingCourses,
                totalRevenue: totalRevenue / 100, // Convert to dollars
                totalPayments,
                recentUsers
            }
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching platform statistics',
            error: error.message
        });
    }
});

// ✅ GET ALL USERS WITH PAGINATION
router.get('/users', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            role,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (role && role !== 'all') {
            filter.role = role;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const users = await User.find(filter)
            .select('-password')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            users,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// ✅ GET USER BY ID
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's enrolled courses if student
        let enrolledCourses = [];
        if (user.role === 'student') {
            enrolledCourses = await Course.find({
                _id: { $in: user.enrolledCourses?.map(e => e.course) || [] }
            }).select('title thumbnail price');
        }

        // Get user's created courses if instructor
        let createdCourses = [];
        if (user.role === 'instructor') {
            createdCourses = await Course.find({ instructor: user._id })
                .select('title thumbnail price isPublished totalStudents');
        }

        // Get user's payment history
        const payments = await Payment.find({ user: user._id })
            .populate('course', 'title thumbnail')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                enrolledCourses,
                createdCourses,
                recentPayments: payments
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details',
            error: error.message
        });
    }
});

// ✅ UPDATE USER ROLE
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        // Validate role
        if (!['student', 'instructor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be student, instructor, or admin'
            });
        }

        // Prevent self-demotion
        if (userId === req.user._id.toString() && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role from admin'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `User role updated to ${role} successfully`,
            user
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
});

// ✅ DELETE USER
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent self-deletion
        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If user is instructor, handle their courses
        if (user.role === 'instructor') {
            // Option 1: Delete all instructor's courses
            // await Course.deleteMany({ instructor: userId });
            
            // Option 2: Transfer courses to admin or mark as unpublished
            await Course.updateMany(
                { instructor: userId },
                { 
                    isPublished: false,
                    $set: { 
                        'metadata.deletedInstructor': true,
                        'metadata.originalInstructor': user.name
                    }
                }
            );
        }

        // Delete user's payments
        await Payment.deleteMany({ user: userId });

        // Delete user
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// ✅ GET ALL COURSES (INCLUDING UNPUBLISHED)
router.get('/courses', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = 'all', // all, published, unpublished
            instructor,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (status === 'published') {
            filter.isPublished = true;
        } else if (status === 'unpublished') {
            filter.isPublished = false;
        }

        if (instructor) {
            filter.instructor = instructor;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const courses = await Course.find(filter)
            .populate('instructor', 'name email')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await Course.countDocuments(filter);

        res.json({
            success: true,
            courses,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalCourses: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
});

// ✅ APPROVE/REJECT COURSE
router.patch('/courses/:id/approve', async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const courseId = req.params.id;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Action must be either "approve" or "reject"'
            });
        }

        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (action === 'approve') {
            course.isPublished = true;
            course.approvedBy = req.user._id;
            course.approvedAt = new Date();
            await course.save();
        } else {
            // For rejection, you might want to add a reason and notify instructor
            course.isPublished = false;
            course.rejectionReason = req.body.reason || 'Course does not meet platform guidelines';
            await course.save();
        }

        res.json({
            success: true,
            message: `Course ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            course
        });

    } catch (error) {
        console.error('Approve course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing course approval',
            error: error.message
        });
    }
});

// ✅ DELETE COURSE (ADMIN CAN DELETE ANY COURSE)
router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Delete associated payments
        await Payment.deleteMany({ course: course._id });

        // Remove course from users' enrolled courses
        await User.updateMany(
            { 'enrolledCourses.course': course._id },
            { $pull: { enrolledCourses: { course: course._id } } }
        );

        // Delete the course
        await Course.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });

    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
});

// ✅ GET ALL PAYMENTS
router.get('/payments', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = 'all',
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (status !== 'all') {
            filter.status = status;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const payments = await Payment.find(filter)
            .populate('user', 'name email')
            .populate('course', 'title thumbnail instructor')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await Payment.countDocuments(filter);

        // Get total revenue
        const revenueResult = await Payment.aggregate([
            { $match: { ...filter, status: 'completed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]);

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        res.json({
            success: true,
            payments,
            summary: {
                totalRevenue: totalRevenue / 100,
                totalPayments: total
            },
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalPayments: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
});

// ✅ PROCESS REFUND
router.post('/payments/:id/refund', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Only completed payments can be refunded'
            });
        }

        // Update payment status to refunded
        payment.status = 'refunded';
        payment.refundReason = req.body.reason || 'Admin initiated refund';
        payment.refundedBy = req.user._id;
        payment.refundedAt = new Date();
        await payment.save();

        // Remove course from user's enrolled courses
        await User.findByIdAndUpdate(payment.user, {
            $pull: { enrolledCourses: { course: payment.course } }
        });

        // Decrement course student count
        await Course.findByIdAndUpdate(payment.course, {
            $inc: { totalStudents: -1 }
        });

        res.json({
            success: true,
            message: 'Refund processed successfully',
            payment
        });

    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing refund',
            error: error.message
        });
    }
});

module.exports = router;