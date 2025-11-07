// In: backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// --- Pre-load all models ---
require('./models/User');
require('./models/Course');
require('./models/Lesson');
require('./models/Quiz');
require('./models/Assignment');
require('./models/Enrollment');
require('./models/Payment');
require('./models/Review');
require('./models/CertificateTemplate');
require('./models/Certificate');
require('./models/Activity');
require('./models/Achievement');
require('./models/AssignmentSubmission'); // <--- ADD THIS LINE
// ----------------------------

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const lessonRoutes = require('./routes/lessons');
const quizRoutes = require('./routes/quizzes');
const enrollmentRoutes = require('./routes/enrollments');
const paymentRoutes = require('./routes/payments');
const certificateRoutes = require('./routes/certificates');
const reviewRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/upload');
const activityRoutes = require('./routes/activity');
const achievementRoutes = require('./routes/achievements');
const utilsRoutes = require('./routes/utils');
const assetsRoutes = require('./routes/assets');
const submissionRoutes = require('./routes/submissions'); // <--- ADD THIS LINE

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { handleMulterError } = require('./middleware/upload');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // Higher limit for dev
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Special raw body parser for Stripe webhook *before* express.json()
app.use('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }));

// --- NEW: Special raw body parser for Paystack webhook ---
// This MUST come BEFORE app.use(express.json())
app.use('/api/payments/webhook/paystack', express.raw({ type: 'application/json' }));
// --------------------------------------------------------

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/submissions', submissionRoutes); // <--- ADD THIS LINE

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Edges Africa LMS API is running',
    timestamp: new Date().toISOString()
  });
});

// Multer Error Handling Middleware
app.use(handleMulterError);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Edges Africa LMS API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;