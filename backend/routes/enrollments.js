const express = require('express');
const { body, query, validationResult } = require('express-validator');
const enrollmentController = require('../controllers/enrollmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Utility to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    next();
};

// @route   GET /api/enrollments
// @desc    Get enrollments (Student gets own, Admin gets all/filtered)
// @access  Private (Student/Admin)
router.get('/',
    auth,
    authorize(['student', 'admin']), // Allow both students and admins
    [ // Optional query validation
         query('status').optional().isIn(['active', 'completed', 'suspended', 'refunded']),
         query('page').optional().isInt({ min: 1 }),
         query('limit').optional().isInt({ min: 1, max: 100 }),
         query('courseId').optional().isMongoId() // For admin filtering
    ],
    handleValidationErrors,
    enrollmentController.getAll
);

// @route   GET /api/enrollments/:id
// @desc    Get single enrollment details
// @access  Private (Owner/Admin)
router.get('/:id',
    auth,
    // Authorization (Owner or Admin) is checked inside controller.getOne
    enrollmentController.getOne
);

// @route   POST /api/enrollments
// @desc    Create enrollment (Student enrolling themselves)
// @access  Private (Student)
router.post('/',
    auth,
    authorize(['student']), // Only students use this to self-enroll
    [
        body('courseId').isMongoId().withMessage('Valid Course ID is required'),
        body('enrollmentType').optional().isIn(['free', 'paid']),
    ],
    handleValidationErrors,
    enrollmentController.create
);

// @route   PUT /api/enrollments/:id
// @desc    Update enrollment (Admin Only)
// @access  Private (Admin)
router.put('/:id',
    auth,
    authorize(['admin']), // Only Admins can use this general update
    [ // Validation for fields admin can change
        body('status').optional().isIn(['active', 'completed', 'suspended', 'refunded'])
    ],
    handleValidationErrors,
    enrollmentController.update
);

// @route   DELETE /api/enrollments/:id
// @desc    Delete enrollment (Admin Only)
// @access  Private (Admin)
router.delete('/:id',
    auth,
    authorize(['admin']), // Only Admins can delete
    enrollmentController.remove
);

// --- Specific Route for Lesson Completion ---

// @route   POST /api/enrollments/:enrollmentId/complete-lesson
// @desc    Mark a lesson as complete for an enrollment
// @access  Private (Student Owner)
router.post('/:id/complete-lesson', // Route param is enrollmentId (matches controller)
     auth,
     authorize(['student']), // Only students mark their own lessons complete
     [
         body('lessonId').isMongoId().withMessage('Valid Lesson ID is required'),
         body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative'),
     ],
     handleValidationErrors,
     // Owner check happens inside controller.completeLesson
     enrollmentController.completeLesson
);

module.exports = router;