const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentType: {
    type: String,
    enum: ['free', 'paid', 'manual'],
    default: 'paid'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'suspended', 'refunded'],
    default: 'active'
  },
  progress: {
    completedLessons: [{
      lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: Number // in seconds
    }],
    currentLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    percentageComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in seconds
    }
  },
  quizAttempts: [{
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    attempts: [{
      score: Number,
      totalPoints: Number,
      percentage: Number,
      passed: Boolean,
      answers: [{
        questionId: String,
        answer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        points: Number
      }],
      timeSpent: Number,
      attemptedAt: {
        type: Date,
        default: Date.now
      }
    }],
    bestScore: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    }
  }],
  assignments: [{
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    submissions: [{
      files: [{
        name: String,
        url: String,
        type: String,
        size: Number
      }],
      text: String,
      submittedAt: {
        type: Date,
        default: Date.now
      },
      score: Number,
      feedback: String,
      gradedAt: Date,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    status: {
      type: String,
      enum: ['not-submitted', 'submitted', 'graded'],
      default: 'not-submitted'
    }
  }],
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    certificateId: String,
    issuedAt: Date,
    certificateUrl: String
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  lastAccessedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });

// Update progress percentage
enrollmentSchema.methods.updateProgress = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);
  
  if (course && course.totalLessons > 0) {
    this.progress.percentageComplete = Math.round(
      (this.progress.completedLessons.length / course.totalLessons) * 100
    );
    
    if (this.progress.percentageComplete === 100 && !this.completedAt) {
      this.status = 'completed';
      this.completedAt = new Date();
    }
    
    await this.save();
  }
};

// --- FIX: Add safeguard ---
module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);