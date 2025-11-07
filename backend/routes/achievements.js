const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController'); // <-- Uses achievementController
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { query, body, validationResult } = require('express-validator');

// Utility for validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
    next();
};

// Validation rules for creating/updating an achievement
const achievementValidation = [
    body('code').notEmpty().withMessage('Achievement code is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('icon').notEmpty().withMessage('Icon is required'),
    body('points').optional().isInt({ min: 0 }).withMessage('Points must be a positive number')
];

// @route   GET /api/achievements
// @desc    Get all achievements for the logged-in user
// @access  Private (Student/Instructor/Admin)
router.get('/',
    auth,
    authorize(['student', 'instructor', 'admin']), // Allows students
    [ // Optional query validation
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 }),
        query('studentId').optional().isMongoId() // For admin use
    ],
    handleValidationErrors,
    achievementController.getAll // <-- Calls achievementController.getAll
);

// @route   POST /api/achievements
// @desc    Create a new achievement definition
// @access  Private (Admin)
router.post('/',
    auth,
    authorize(['admin']),
    achievementValidation,
    handleValidationErrors,
    achievementController.create
);

// @route   GET /api/achievements/:id
// @desc    Get a single achievement definition
// @access  Private (Admin)
router.get('/:id',
    auth,
    authorize(['admin']),
    achievementController.getOne
);

// @route   PUT /api/achievements/:id
// @desc    Update an achievement definition
// @access  Private (Admin)
router.put('/:id',
    auth,
    authorize(['admin']),
    achievementValidation,
    handleValidationErrors,
    achievementController.update
);

// @route   DELETE /api/achievements/:id
// @desc    Delete an achievement definition
// @access  Private (Admin)
router.delete('/:id',
    auth,
    authorize(['admin']),
    achievementController.remove
);

module.exports = router;