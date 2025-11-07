const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password not required if using social login
      return !(this.socialLogin && (this.socialLogin.google?.id || this.socialLogin.facebook?.id));
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  avatar: {
    public_id: String,
    url: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  skills: [String],
  location: String,
  website: String,
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  socialLogin: {
    google: {
      id: String,
      email: String
    },
    facebook: {
      id: String,
      email: String
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  lastLogin: Date,
  loginSessions: [{
    token: String,
    device: String,
    ip: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  loginStreak: {
    type: Number,
    default: 0
  },
  // --- NEW FIELD FOR EARNED ACHIEVEMENTS ---
  earnedAchievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }]
  // ---------------------------------------
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || (this.socialLogin && (this.socialLogin.google?.id || this.socialLogin.facebook?.id))) {
     return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = require('crypto').randomBytes(20).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = require('crypto').randomBytes(20).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

// FIX: Check if model already exists before compiling
module.exports = mongoose.models.User || mongoose.model('User', userSchema);