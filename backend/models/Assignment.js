const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    lesson: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: true,
    },
    instructions: String,
    maxScore: Number,
    dueDate: Date,
    allowedFileTypes: [String],
    maxFileSize: Number,
  },
  {
    timestamps: true,
  }
);

// --- FIX: Check if model already exists before compiling ---
module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);