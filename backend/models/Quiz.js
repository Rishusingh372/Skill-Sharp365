const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  questions: [
    {
      text: { type: String, required: true },
      options: [{ type: String }],
      correctIndex: { type: Number, required: true }
    }
  ],
  passingScorePercent: { type: Number, default: 50 }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
