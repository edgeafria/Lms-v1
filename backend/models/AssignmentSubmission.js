// In: backend/models/AssignmentSubmission.js
const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Submission content is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded'],
    default: 'submitted'
  },
  grade: {
    type: Number,
    min: 0,
    default: null
  },
  feedback: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: {
    type: Date
  }
}, {
  timestamps: true // This will add createdAt and updatedAt
});

// Create a compound index to ensure one submission per student per lesson
assignmentSubmissionSchema.index({ lesson: 1, student: 1 }, { unique: true });
assignmentSubmissionSchema.index({ course: 1, student: 1 });

// When a submission is saved, update its timestamp
assignmentSubmissionSchema.pre('save', function(next) {
  if (this.isModified('content') && this.status !== 'graded') {
    this.submittedAt = Date.now();
    this.status = 'submitted'; // Reset to 'submitted' if re-submitting
  }
  if (this.isModified('grade') && this.grade !== null) {
    this.gradedAt = Date.now();
    this.status = 'graded';
  }
  next();
});

module.exports = mongoose.models.AssignmentSubmission || mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);