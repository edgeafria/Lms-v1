const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
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
  module: {
    type: mongoose.Schema.Types.ObjectId, // <-- FIX: Was 'String', now 'ObjectId'
    // ref: 'Module', // No ref needed since it's an ID within a subdocument
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: [true, 'Lesson type is required'],
    enum: ['video', 'text', 'quiz', 'assignment', 'live', 'download']
  },
  content: {
    // For video lessons
    video: {
      source: {
        type: String,
        enum: ['upload', 'youtube', 'vimeo', 'embed']
      },
      url: String,
      public_id: String,
      duration: Number,
      quality: String,
      subtitles: [{
        language: String,
        url: String
      }]
    },
    // For text lessons
    text: {
      body: String,
      attachments: [{
        name: String,
        url: String,
        type: String,
        size: Number
      }]
    },
    // For quiz lessons
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz' // <-- This is correct
    },
    // For assignment lessons
    assignment: {
      instructions: String,
      maxScore: Number,
      dueDate: Date,
      allowedFileTypes: [String],
      maxFileSize: Number
    },
    // For live lessons
    live: {
      meetingUrl: String,
      scheduledAt: Date,
      duration: Number,
      recordingUrl: String
    },
    // For download lessons
    download: {
      files: [{
        name: String,
        url: String,
        type: String,
        size: Number
      }]
    }
  },
  duration: {
    type: Number,
    default: 0
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  notes: String,
  transcript: String,
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ course: 1, module: 1 });
lessonSchema.index({ type: 1 });
lessonSchema.index({ status: 1 });
lessonSchema.index({ isPreview: 1 });

// Update course total duration when lesson is saved
lessonSchema.post('save', async function() {
  // Use try-catch to prevent errors here from stopping the main request
  try {
    const Course = mongoose.model('Course');
    const lessons = await mongoose.model('Lesson').find({ course: this.course });
    const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    const totalLessons = lessons.length;
    
    await Course.findByIdAndUpdate(this.course, {
      totalDuration,
      totalLessons
    });
  } catch (error) {
    console.error("Error in Lesson post-save hook:", error);
  }
});

// Prevent OverwriteModelError
module.exports = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
