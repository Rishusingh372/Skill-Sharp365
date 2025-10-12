const express = require('express');
const { authMiddleware, requireInstructor, requireAdmin } = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const router = express.Router();

// ✅ GET ALL PUBLISHED COURSES (Public)
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            level,
            minPrice,
            maxPrice,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = { isPublished: true };
        
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Search in title, description, and tags
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
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
            .skip((page - 1) * limit)
            .select('-studentsEnrolled -learningOutcomes -requirements');

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

// ✅ GET FEATURED COURSES (Public)
router.get('/featured', async (req, res) => {
    try {
        const featuredCourses = await Course.find({ 
            isPublished: true, 
            isFeatured: true 
        })
        .populate('instructor', 'name email')
        .limit(6)
        .sort({ rating: -1, totalStudents: -1 })
        .select('-studentsEnrolled');

        res.json({
            success: true,
            courses: featuredCourses
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching featured courses', 
            error: error.message 
        });
    }
});

// ✅ GET SINGLE COURSE BY ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email bio')
            .populate('studentsEnrolled', 'name email');

        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        // Only return full details if course is published or user is instructor/admin
        if (!course.isPublished && 
            (!req.user || 
             (req.user._id.toString() !== course.instructor._id.toString() && 
              req.user.role !== 'admin'))) {
            return res.status(403).json({ 
                success: false,
                message: 'Course is not published' 
            });
        }

        res.json({
            success: true,
            course
        });

    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Error fetching course', 
            error: error.message 
        });
    }
});


// ✅ UPDATE COURSE (Course instructor or admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        // Check if user is instructor of this course or admin
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. You can only update your own courses' 
            });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('instructor', 'name email');

        res.json({
            success: true,
            message: 'Course updated successfully',
            course: updatedCourse
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                message: 'Validation error',
                errors 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Error updating course', 
            error: error.message 
        });
    }
});

// ✅ GET INSTRUCTOR'S COURSES (Protected)
router.get('/instructor/my-courses', authMiddleware, requireInstructor, async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id })
            .populate('instructor', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            courses,
            total: courses.length
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching your courses', 
            error: error.message 
        });
    }
});

// ✅ PUBLISH/UNPUBLISH COURSE (Instructor only)
router.patch('/:id/publish', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied' 
            });
        }

        course.isPublished = !course.isPublished;
        await course.save();

        res.json({
            success: true,
            message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
            course
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error updating course status', 
            error: error.message 
        });
    }
});

// ✅ DELETE COURSE (Instructor or admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        // Check ownership or admin
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied' 
            });
        }

        await Course.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error deleting course', 
            error: error.message 
        });
    }
});

// ✅ CREATE NEW COURSE (Instructors only) - UPDATED FOR CLOUDINARY
router.post('/', authMiddleware, requireInstructor, async (req, res) => {
    try {
        const {
            title,
            description,
            shortDescription,
            price,
            thumbnail, // Now this should be the Cloudinary URL from upload
            category,
            level,
            requirements,
            learningOutcomes,
            tags,
            totalHours,
            language
        } = req.body;

        // Validate required fields
        if (!title || !description || !price || !thumbnail || !category) {
            return res.status(400).json({ 
                success: false,
                message: 'Title, description, price, thumbnail, and category are required' 
            });
        }

        // Validate thumbnail is a Cloudinary URL
        if (!thumbnail.includes('cloudinary.com')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid thumbnail URL. Please upload image first.'
            });
        }

        // Create course
        const course = await Course.create({
            title,
            description,
            shortDescription: shortDescription || description.substring(0, 200),
            price: Number(price),
            thumbnail,
            instructor: req.user._id,
            category,
            level: level || 'beginner',
            requirements: requirements || [],
            learningOutcomes: learningOutcomes || [],
            tags: tags || [],
            totalHours: totalHours || 0,
            language: language || 'English'
        });

        // Populate instructor details
        await course.populate('instructor', 'name email');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });

    } catch (error) {
        console.error('Create course error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                message: 'Validation error',
                errors 
            });
        }

        res.status(500).json({ 
            success: false,
            message: 'Error creating course', 
            error: error.message 
        });
    }
});

module.exports = router;