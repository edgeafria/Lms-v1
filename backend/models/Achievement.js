const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    // A unique code to identify the achievement in the backend logic
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      enum: [
          'FIRST_ENROLLMENT', // Example: User enrolls in their first course
          'FIRST_LESSON_COMPLETE', // Example: User completes any lesson
          'COURSE_COMPLETED', // Example: User completes a course
          'PERFECT_QUIZ', // Example: User gets 100% on a quiz
          'LOGIN_STREAK_3', // Example: User hits a 3-day login streak
          'LOGIN_STREAK_7', // Example: User hits a 7-day login streak
          // Add more codes as you dream up new achievements
      ],
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
    },
    icon: {
      type: String, // Can be an emoji "🚀" or an icon name "rocket-launch"
      required: true,
    },
    points: { // Optional: for a gamification system
        type: Number,
        default: 10
    }
  },
  {
    timestamps: true,
  }
);

// This ensures the model is not re-compiled (prevents OverwriteModelError)
module.exports = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema);