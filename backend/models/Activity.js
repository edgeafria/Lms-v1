const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for fast lookup of a user's activities
    },
    // The type of action performed
    type: {
      type: String,
      required: true,
      enum: [
        'ENROLLMENT',     // User enrolled in a course
        'LESSON_COMPLETE',// User completed a lesson
        'QUIZ_ATTEMPT',   // User attempted a quiz
        'REVIEW_SUBMITTED', // User submitted a review
        'CERTIFICATE_EARNED'// User earned a certificate
        // Add more types as needed
      ],
    },
    // A human-readable message for the feed
    message: {
      type: String,
      required: true,
    },
    // Contextual links
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Sort user activities by most recent by default
activitySchema.index({ user: 1, createdAt: -1 });

// --- FIX: Check if model already exists before compiling ---
module.exports = mongoose.models.Activity || mongoose.model('Activity', activitySchema);