const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided, authorization denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from token
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Token is not valid' 
            });
        }

        // Attach user to request object
        req.user = user;
        next();
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Token is not valid' 
        });
    }
};

// Instructor role middleware
const requireInstructor = (req, res, next) => {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Instructor role required' 
        });
    }
    next();
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin role required' 
        });
    }
    next();
};

module.exports = { 
    authMiddleware, 
    requireInstructor, 
    requireAdmin 
};