const mongoose = require('mongoose');

const DiscussionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  body: String,
  replies: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      body: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Discussion', DiscussionSchema);
