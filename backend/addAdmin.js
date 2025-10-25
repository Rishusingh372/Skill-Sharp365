const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Admin user details
const adminData = {
    username: 'Admin',
    email: 'admin@udemy.com',
    password: 'admin123',
    role: 'admin'
};

async function addAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create new admin user
        const admin = new User(adminData);
        await admin.save();

        console.log('Admin user created successfully');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the script
addAdmin();
