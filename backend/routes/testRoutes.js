const express = require('express');
const { authMiddleware, requireInstructor, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// 🔐 Public route - anyone can access
router.get('/public', (req, res) => {
    res.json({
        success: true,
        message: 'This is a public route - anyone can access'
    });
});

// 🔐 Protected route - any authenticated user
router.get('/protected', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'This is a protected route - only authenticated users can access',
        user: req.user
    });
});

// 🔐 Instructor only route
router.get('/instructor-only', authMiddleware, requireInstructor, (req, res) => {
    res.json({
        success: true,
        message: 'This is an instructor-only route',
        user: req.user
    });
});

// 🔐 Admin only route
router.get('/admin-only', authMiddleware, requireAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'This is an admin-only route',
        user: req.user
    });
});

module.exports = router;