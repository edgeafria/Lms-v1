// In: backend/routes/assets.js
const express = require('express');
const router = express.Router();
const { getAsset } = require('../controllers/assetsController');
const auth = require('../middleware/auth'); // Import your auth middleware

// @route   GET /api/assets
// @desc    Get/download a private asset (PDF, doc)
// @access  Private (Logged-in users)
router.get('/', auth, getAsset);

module.exports = router;