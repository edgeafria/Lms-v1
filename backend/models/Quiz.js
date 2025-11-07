const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    type: {
      type: String,
      required: true,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank']
    },
    question: {
      type: String,
      required: true
    },
    options: [{
      text: String,
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    correctAnswer: String, // For short answer and essay questions
    points: {
      type: Number,
      default: 1,
      min: 1
    },
    explanation: String,
    order: {
      type: Number,
      required: true
    }
  }],
  settings: {
    timeLimit: {
      type: Number,
      default: 0 // 0 means no time limit
    },
    attempts: {
      type: Number,
      default: 1,
      min: 1
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: String,
      enum: ['immediately', 'after-submission', 'never'],
      default: 'after-submission'
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    }
  },
  instructions: String,
  totalPoints: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
quizSchema.index({ course: 1 });
quizSchema.index({ instructor: 1 });
quizSchema.index({ status: 1 });

// Calculate total points before saving
quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, question) => sum + question.points, 0);
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);