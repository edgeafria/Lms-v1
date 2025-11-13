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
require('./models/AssignmentSubmission'); 
require('./models/Category');
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
const submissionRoutes = require('./routes/submissions'); 
const categoryRoutes = require('./routes/categories'); 
const assessmentRoutes = require('./routes/assessments'); // 🐞 --- ADD THIS LINE ---

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { handleMulterError } = require('./middleware/upload');

const app = express();

// ... (rest of your middleware: helmet, cors, rateLimit, webhooks, json) ...
// Security middleware
app.use(helmet());
const allowedOrigins = [
  'https://dashboard.edgesafrica.org',
  'https://www.dashboard.edgesafrica.org',
  // You can also add your local dev URL if you want to test without the proxy
  'http://localhost:3000' ,
];

const corsOptions = {
  origin: function (origin, callback) {
    // Check if the incoming request's origin is in our whitelist
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      // Allow the request
      callback(null, true);
    } else {
      // Block the request
      callback(new Error('This origin is not allowed by CORS.'));
    }
  },
  credentials: true, // Allow cookies to be sent (if you use them)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] // Allow all standard methods
};

// Use the CORS middleware with your options
app.use(cors(corsOptions));

// Also, handle pre-flight (OPTIONS) requests
app.options('*', cors(corsOptions));
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:3000',
//   credentials: true
// }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // Higher limit for dev
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/v1/', limiter);

// Special raw body parser for Stripe webhook *before* express.json()
app.use('/v1/payments/webhook/stripe', express.raw({ type: 'application/json' }));

// --- NEW: Special raw body parser for Paystack webhook ---
// This MUST come BEFORE app.use(express.json())
app.use('/v1/payments/webhook/paystack', express.raw({ type: 'application/json' }));
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
app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/courses', courseRoutes);
app.use('/v1/lessons', lessonRoutes);
app.use('/v1/quizzes', quizRoutes);
app.use('/v1/enrollments', enrollmentRoutes);
app.use('/v1/payments', paymentRoutes);
app.use('/v1/certificates', certificateRoutes);
app.use('/v1/reviews', reviewRoutes);
app.use('/v1/analytics', analyticsRoutes);
app.use('/v1/upload', uploadRoutes);
app.use('/v1/activities', activityRoutes);
app.use('/v1/achievements', achievementRoutes);
app.use('/v1/utils', utilsRoutes);
app.use('/v1/assets', assetsRoutes);
app.use('/v1/submissions', submissionRoutes); 
app.use('/v1/categories', categoryRoutes); 
app.use('/v1/assessments', assessmentRoutes); // 🐞 --- ADD THIS LINE ---

// Health check endpoint
app.get('/v1/health', (req, res) => {
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