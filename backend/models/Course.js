const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Course title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: { 
        type: String, 
        required: [true, 'Course description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    shortDescription: {
        type: String,
        maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    price: { 
        type: Number, 
        required: [true, 'Course price is required'],
        min: [0, 'Price cannot be negative'],
        default: 0
    },
    thumbnail: { 
        type: String, 
       
    },
    instructor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    category: { 
        type: String, 
        required: [true, 'Course category is required'],
        enum: [
            'web-development',
            'mobile-development', 
            'data-science',
            'business',
            'design',
            'marketing',
            'music',
            'photography',
            'health',
            'lifestyle'
        ]
    },
    level: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced', 'all-levels'], 
        default: 'beginner' 
    },
    isPublished: { 
        type: Boolean, 
        default: false 
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    studentsEnrolled: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    totalStudents: {
        type: Number,
        default: 0
    },
    rating: { 
        type: Number, 
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot be more than 5']
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    totalHours: { 
        type: Number, 
        default: 0,
        min: [0, 'Total hours cannot be negative']
    },
    lectures: {
        type: Number,
        default: 0
    },
    resources: {
        type: Number,
        default: 0
    },
    language: {
        type: String,
        default: 'English'
    },
    requirements: [{
        type: String
    }],
    learningOutcomes: [{
        type: String
    }],
    tags: [{
        type: String
    }]
}, { 
    timestamps: true 
});

// Update totalStudents when students enroll
courseSchema.virtual('enrollmentCount').get(function() {
    return this.studentsEnrolled.length;
});

// Update average rating
courseSchema.methods.updateRating = function(newRating) {
    const totalScore = (this.rating * this.totalRatings) + newRating;
    this.totalRatings += 1;
    this.rating = totalScore / this.totalRatings;
    return this.save();
};

// Index for better search performance
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, level: 1, price: 1 });
courseSchema.index({ instructor: 1 });

module.exports = mongoose.model('Course', courseSchema);