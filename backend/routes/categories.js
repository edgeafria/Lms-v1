const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Utility to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    next();
};

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private (Admin)
router.get(
  '/',
  // auth,
  // authorize(['admin']),
  categoryController.getAllCategories
);

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin)
router.post(
  '/',
  auth,
  authorize(['admin']),
  [
    body('label').trim().notEmpty().withMessage('Label is required'),
    body('value').trim().notEmpty().withMessage('Value is required').isSlug().withMessage('Value must be a valid slug'),
  ],
  handleValidationErrors,
  categoryController.createCategory
);

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin)
router.delete(
  '/:id',
  auth,
  authorize(['admin']),
  categoryController.deleteCategory
);

module.exports = router;