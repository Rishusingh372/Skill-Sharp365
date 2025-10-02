const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage engine for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'udemy-clone/courses',
        format: async (req, file) => {
            // Return image format
            return 'jpg'; // or 'png', 'webp' based on your preference
        },
        public_id: (req, file) => {
            // Generate unique filename
            return `course-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        },
        transformation: [
            { width: 800, height: 450, crop: 'limit' }, // Resize for course thumbnails
            { quality: 'auto' }, // Optimize quality
            { format: 'jpg' } // Convert to JPG
        ]
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Utility function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw error;
    }
};

// Utility function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    const matches = url.match(/\/udemy-clone\/courses\/course-[\w-]+/);
    return matches ? matches[0].substring(1) : null;
};

module.exports = {
    cloudinary,
    upload,
    deleteFromCloudinary,
    getPublicIdFromUrl
};