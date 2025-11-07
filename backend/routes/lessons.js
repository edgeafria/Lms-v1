const express = require('express');
const { body, query, validationResult } = require('express-validator');
const lessonController = require('../controllers/lessonController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

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

// Validation rules for creating/updating a lesson
const lessonValidationRules = [
  body('title').trim().notEmpty().withMessage('Lesson title is required'),
  body('type')
    .isIn(['video', 'text', 'quiz', 'assignment', 'live', 'download'])
    .withMessage('Invalid lesson type'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
  body('isPreview').optional().isBoolean(),
  body('isFree').optional().isBoolean(),
];

// Get all lessons (typically filtered by course/module)
// Access control is handled within the controller based on course status/enrollment
router.get(
  '/',
  [
    query('courseId').isMongoId().withMessage('Valid Course ID is required'),
    query('moduleId').isMongoId().withMessage('Valid Module ID is required'),
  ],
  handleValidationErrors,
  lessonController.getAll // Note: 'auth' middleware is optional here, controller handles access
);

// Get a single lesson
// Access control is handled within the controller
router.get(
  '/:id',
  auth, // Requires auth to check enrollment status for non-free lessons
  lessonController.getOne
);

// Create a new lesson
router.post(
  '/',
  auth,
  authorize(['instructor', 'admin']),
  [
    body('courseId').isMongoId().withMessage('Valid Course ID is required'),
    body('moduleId').isMongoId().withMessage('Valid Module ID is required'),
    ...lessonValidationRules,
  ],
  handleValidationErrors,
  lessonController.create
);

// Update a lesson
router.put(
  '/:id',
  auth,
  authorize(['instructor', 'admin']),
  lessonValidationRules, // Reuse validation rules
  handleValidationErrors,
  lessonController.update
);

// Delete a lesson
router.delete(
  '/:id',
  auth,
  authorize(['instructor', 'admin']),
  lessonController.remove
);

module.exports = router;