const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: [
    {
      title: String,
      type: { type: String, enum: ['video','pdf','quiz','text','file'], default: 'text' },
      url: String,
      metadata: Object
    }
  ],
  price: { type: Number, default: 0 },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);
