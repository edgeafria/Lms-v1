const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController'); // <-- Uses activityController
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { query, validationResult } = require('express-validator');

// Utility for validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
    next();
};

// @route   GET /api/activities
// @desc    Get activity feed for the logged-in user
// @access  Private (Student/Instructor/Admin)
router.get('/',
    auth,
    authorize(['student', 'instructor', 'admin']), // Allows students
    [ 
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    handleValidationErrors,
    activityController.getAll // <-- Calls activityController.getAll
);

// Other methods are not allowed
router.get('/:id', auth, authorize(['admin']), activityController.getOne);
router.post('/', auth, authorize(['admin']), activityController.create);
router.put('/:id', auth, authorize(['admin']), activityController.update);
router.delete('/:id', auth, authorize(['admin']), activityController.remove);

module.exports = router;