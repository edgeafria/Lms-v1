const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const auth = require('../middleware/auth'); // Import auth middleware
const authorize = require('../middleware/authorize'); // Import authorize middleware
const { body, validationResult } = require('express-validator'); // Import validator
const mongoose = require('mongoose'); // Import mongoose if needed for ID validation

// Utility for validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
    next();
};


// @route   GET /api/certificates
// @desc    Get Certificates (Student gets own, Admin gets filtered)
// @access  Private (Student/Admin)
router.get('/',
    auth, // Add auth middleware
    authorize(['student', 'admin']), // Add authorize middleware
    certificateController.getAll
);

// @route   GET /api/certificates/:id
// @desc    Get single certificate details
// @access  Private (Owner/Admin)
router.get('/:id',
    auth, // Add auth middleware
    // Owner/Admin check happens inside controller
    certificateController.getOne
);

// @route   POST /api/certificates
// @desc    Generate/Create Certificate Record
// @access  Private (Student/Admin)
router.post('/',
    auth, // Add auth middleware
    authorize(['student', 'admin']), // Add authorize middleware
    [ // Add validation for the request body
        body('enrollmentId').isMongoId().withMessage('Valid Enrollment ID is required')
    ],
    handleValidationErrors, // Handle validation errors
    certificateController.create
);

// @route   PUT /api/certificates/:id
// @desc    Update certificate (Admin Only)
// @access  Private (Admin)
router.put('/:id',
    auth, // Add auth middleware
    authorize(['admin']), // Add authorize middleware
    // Add validation rules if needed
    certificateController.update
);

// @route   DELETE /api/certificates/:id
// @desc    Delete/Revoke certificate (Admin Only)
// @access  Private (Admin)
router.delete('/:id',
    auth, // Add auth middleware
    authorize(['admin']), // Add authorize middleware
    certificateController.remove
);

module.exports = router;