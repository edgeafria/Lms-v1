const express = require('express');
const { body, query, validationResult } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const mongoose = require('mongoose');

const router = express.Router();

// Utility for validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
    next();
};

// Validation rules for creating/updating a review
const reviewValidation = [
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required').isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters')
];

// @route   GET /api/reviews
router.get('/',
    auth,
    [
        query('courseId').optional().isMongoId(),
        query('studentId').optional().isMongoId(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 }),
        query('sort').optional().isIn(['createdAt', 'rating_high', 'rating_low'])
    ],
    handleValidationErrors,
    reviewController.getAll
);

// @route   GET /api/reviews/:id
router.get('/:id',
    reviewController.getOne
);

// @route   POST /api/reviews
router.post('/',
    auth,
    authorize(['student']),
    [
        body('courseId').isMongoId().withMessage('Valid Course ID is required'),
        ...reviewValidation
    ],
    handleValidationErrors,
    reviewController.create
);

// @route   PUT /api/reviews/:id
router.put('/:id',
    auth,
    reviewValidation,
    handleValidationErrors,
    reviewController.update
);

// @route   DELETE /api/reviews/:id
router.delete('/:id',
    auth,
    reviewController.remove
);

module.exports = router;