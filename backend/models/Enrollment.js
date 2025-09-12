const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: ['pending','paid','active'], default: 'pending' },
  paymentId: { type: String },
  progress: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
