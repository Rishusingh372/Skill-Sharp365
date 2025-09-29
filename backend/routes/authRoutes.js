const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async (req ,res)=>{
    try {
        const {name , email , password , role} = req.body;

        // Check if user exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: 'User already exists'});
        }

        // Create new user
        const user = new User({username: name, email, password, role});
        
        // Generate JWT token
        const token =jwt.sign(
            {userId: user._id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {id: user._id, name: user.username, email: user.email, role: user.role}
        });
        
    } catch (error) {
        res.status(500).json({message: 'Server error', error: error.message});
        
    }
});

// Login
router.post('/login', async (req ,res)=>{
    try {
        const {email , password} = req.body;

        // find user 
        const user = await User.findOne({email});
        if(!user || !(await user.comparePassword(password)) ){
            return res.status(400).json({message: 'Invalid credentials'});
        }
        // Generate JWT token
        const token =jwt.sign(
            {userId: user._id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );
        res.json({
            message: 'Login successful',
            token,
            user: {id: user._id, name: user.username, email: user.email, role: user.role}
        });
    } catch (error) {
        res.status(500).json({message: 'Server error', error: error.message});
    }
});

module.exports = router;