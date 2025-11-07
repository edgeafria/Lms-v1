const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coInstructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['web-development', 'mobile-development', 'data-science', 'digital-marketing', 'business', 'design', 'other']
  },
  subcategory: String,
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  language: {
    type: String,
    default: 'English'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  thumbnail: {
    public_id: String,
    url: String
  },
  trailer: {
    public_id: String,
    url: String,
    duration: Number
  },
  images: [{
    public_id: String,
    url: String
  }],
  tags: [String],
  requirements: [String],
  learningOutcomes: [String],
  targetAudience: [String],
  modules: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    order: {
      type: Number,
      required: true
    },
    lessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }],
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
  }],
  totalDuration: {
    type: Number,
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  featured: {
    type: Boolean,
    default: false
  },
  bestseller: {
    type: Boolean,
    default: false
  },
  newCourse: {
    type: Boolean,
    default: true
  },
  dripContent: {
    enabled: {
      type: Boolean,
      default: false
    },
    schedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1
    }
  },
  certificate: {
    enabled: {
      type: Boolean,
      default: true
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CertificateTemplate'
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ featured: 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ slug: 1 });

// Generate slug before saving
courseSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '') // Keep only letters, numbers, spaces
      .trim()
      .replace(/\s+/g, '-');
  }
  next();
});

// Update course statistics
courseSchema.methods.updateStats = async function() {
  const Enrollment = mongoose.model('Enrollment');
  const Review = mongoose.model('Review');
  const Lesson = mongoose.model('Lesson');
  
  // Update counts
  this.enrollmentCount = await Enrollment.countDocuments({ course: this._id });
  this.totalLessons = await Lesson.countDocuments({ course: this._id });

  // Update rating
  const reviews = await Review.find({ course: this._id });
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal
    this.rating.count = reviews.length;
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
  }

  // Update duration
  const lessons = await Lesson.find({ course: this._id });
  this.totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  
  await this.save();
};

// --- FIX: Check if model already exists before compiling ---
module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);