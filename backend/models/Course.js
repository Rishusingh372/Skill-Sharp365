import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
  title: String,
  slug: String,
  videoUrl: String,
  duration: Number,
  resources: [String],
  createdAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  category: String,
  price: { type: Number, default: 0 },
  thumbnail: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lectures: [lectureSchema],
  studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Course', courseSchema);
