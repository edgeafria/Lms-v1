const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController'); // <-- Uses analyticsController
const auth = require('../middleware/auth');
const { query, validationResult } = require('express-validator');

// Utility for validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
    next();
};

// @route   GET /api/analytics
// @desc    Get various analytics data based on query params
// @access  Private (Admin/Instructor)
router.get('/',
    auth,
    // Note: Authorization is handled *inside* the controller for this route
    [ // Validate query params
        query('type').optional().isIn(['dashboard', 'revenue', 'students']),
        query('period').optional().isIn(['7d', '30d', '90d', 'all']),
        query('courseId').optional().isMongoId()
    ],
    handleValidationErrors,
    analyticsController.getAll // <-- Calls analyticsController.getAll
);

// @route   GET /api/analytics/:id (Interpreted as Course ID for stats)
// @desc    Get specific analytics (e.g., Course Stats)
// @access  Private (Owner/Admin)
router.get('/:id',
    auth,
    [ // Validate query param
        query('period').optional().isIn(['7d', '30d', '90d', 'all'])
    ],
    handleValidationErrors,
    analyticsController.getOne // Controller handles authorization
);

// POST, PUT, DELETE are generally not used for analytics retrieval
router.post('/', auth, analyticsController.create);
router.put('/:id', auth, analyticsController.update);
router.delete('/:id', auth, analyticsController.remove);

module.exports = router;