const express = require('express');
const { body, validationResult } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload'); // Import upload middleware

const router = express.Router();

// Utility to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// --- 🐞 NEW PUBLIC ROUTE ---
// @route   GET /api/users/instructors
// @desc    Get all active instructors (Public)
// @access  Public
router.get(
  '/instructors',
  userController.getInstructors
);
// -----------------------------


// --- Profile Routes (for the logged-in user) ---

router.get(
  '/profile',
  auth, // Protects route, attaches req.user
  userController.getProfile
);

router.put(
  '/profile',
  auth, // Protects route, attaches req.user
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('location').optional().trim(),
    body('skills').optional().isArray(), // Check if it's an array (even if empty)

    // --- CORRECTED VALIDATION ---
    // Only run isURL() if the field is not empty
    body('website')
      .if(body('website').notEmpty()) // Only validates if string is not ""
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Website must be a valid URL (e.g., https://...)'),

    body('socialLinks.facebook')
      .if(body('socialLinks.facebook').notEmpty())
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Facebook URL must be a valid URL (e.g., https://...)'),

    body('socialLinks.twitter')
      .if(body('socialLinks.twitter').notEmpty())
      .isURL({ protocols: ['http', 'https...'], require_protocol: true })
      .withMessage('Twitter URL must be a valid URL (e.g., https://...)'),

    body('socialLinks.linkedin')
      .if(body('socialLinks.linkedin').notEmpty())
      .isURL({ protocols: ['http', 'https...'], require_protocol: true })
      .withMessage('LinkedIn URL must be a valid URL (e.g., https://...)'),

    body('socialLinks.instagram')
      .if(body('socialLinks.instagram').notEmpty())
      .isURL({ protocols: ['http', 'https...'], require_protocol: true })
      .withMessage('Instagram URL must be a valid URL (e.g., https://...)'),
    // -----------------------------
  ],
  handleValidationErrors,
  userController.updateProfile
);

router.post(
  '/change-password',
  auth, // Protects route, attaches req.user
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  handleValidationErrors,
  userController.changePassword
);

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post(
  '/upload-avatar',
  auth, // 1. Check user is logged in
  upload.single('avatar'), // 2. Handle the file upload (expects field 'avatar')
  userController.uploadAvatar // 3. Run controller logic
);

// --- Admin Routes (for managing all users) ---

// 🐞 --- NEW ROUTE FOR STATS --- 🐞
// @route   GET /api/users/stats
// @desc    Get user stats (Admin)
// @access  Private/Admin
router.get(
  '/stats',
  auth,
  authorize(['admin']),
  userController.getUserStats
);

router.get(
  '/',
  auth,
  authorize(['admin']), // Protects route for admins only
  userController.getAll
);

// 🐞 --- NEW ROUTE FOR CREATING USERS --- 🐞
// @route   POST /api/users
// @desc    Create a new user (Admin)
// @access  Private/Admin
router.post(
  '/',
  auth,
  authorize(['admin']),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'instructor', 'admin']).withMessage('Invalid role')
  ],
  handleValidationErrors,
  userController.create
);

router.get(
  '/:id',
  auth,
  authorize(['admin']), // Protects route for admins only
  userController.getOne
);

router.put(
  '/:id',
  auth,
  authorize(['admin']), // Protects route for admins only
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['student', 'instructor', 'admin']),
    body('isActive').optional().isBoolean(),
  ],
  handleValidationErrors,
  userController.update
);

router.delete(
  '/:id',
  auth,
  authorize(['admin']), // Protects route for admins only
  userController.remove
);

module.exports = router;