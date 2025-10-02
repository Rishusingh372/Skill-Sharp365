const express = require('express');
const { authMiddleware, requireInstructor } = require('../middlewares/authMiddleware');


const { upload, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');
const Course = require('../models/Course');

const router = express.Router();

// ✅ UPLOAD COURSE THUMBNAIL (Instructors only)
router.post('/course-thumbnail', authMiddleware, requireInstructor, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: req.file.path,
            publicId: req.file.filename
        });

    } catch (error) {
        console.error('Upload error:', error);
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
});

// ✅ UPLOAD PROFILE PICTURE (Any authenticated user)
router.post('/profile-picture', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            imageUrl: req.file.path,
            publicId: req.file.filename
        });

    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile picture',
            error: error.message
        });
    }
});

// ✅ DELETE IMAGE (Instructors & Admin only)
router.delete('/image', authMiddleware, requireInstructor, async (req, res) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Image URL is required'
            });
        }

        const publicId = getPublicIdFromUrl(imageUrl);
        
        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Cloudinary URL'
            });
        }

        const result = await deleteFromCloudinary(publicId);

        if (result.result === 'ok') {
            res.json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete image'
            });
        }

    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting image',
            error: error.message
        });
    }
});

// ✅ UPDATE COURSE THUMBNAIL (Replace old image)
router.put('/course-thumbnail/:courseId', authMiddleware, requireInstructor, upload.single('image'), async (req, res) => {
    try {
        const { courseId } = req.params;

        // Find the course
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user owns the course or is admin
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own courses'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Delete old thumbnail from Cloudinary if it exists
        if (course.thumbnail) {
            const oldPublicId = getPublicIdFromUrl(course.thumbnail);
            if (oldPublicId) {
                try {
                    await deleteFromCloudinary(oldPublicId);
                } catch (deleteError) {
                    console.error('Error deleting old thumbnail:', deleteError);
                    // Continue with update even if deletion fails
                }
            }
        }

        // Update course with new thumbnail
        course.thumbnail = req.file.path;
        await course.save();

        res.json({
            success: true,
            message: 'Course thumbnail updated successfully',
            imageUrl: req.file.path,
            course: {
                id: course._id,
                title: course.title,
                thumbnail: course.thumbnail
            }
        });

    } catch (error) {
        console.error('Update thumbnail error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating course thumbnail',
            error: error.message
        });
    }
});

module.exports = router;