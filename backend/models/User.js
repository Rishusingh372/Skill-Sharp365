const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },

   // Add enrolled courses array
    enrolledCourses: [{
        course: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Course' 
        },
        enrolledAt: { 
            type: Date, 
            default: Date.now 
        },
        progress: {
            completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
            lastAccessed: { type: Date, default: Date.now },
            completionPercentage: { type: Number, default: 0 }
        }
    }],
    
    // Stripe customer ID for future payments
    stripeCustomerId: {
        type: String
    }
}, { timestamps: true });


// Hash password before saving
UserSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})


// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

module.exports = mongoose.model('User', UserSchema);