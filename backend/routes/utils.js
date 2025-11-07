// In: backend/routes/utils.js
const express = require('express');
const router = express.Router();
const { getOEmbedDetails } = require('../controllers/utilsController');
const auth = require('../middleware/auth'); // Import your auth middleware

// @route   GET /api/utils/oembed
// @desc    Get YouTube video title via oEmbed
// @access  Private (Logged-in users)
router.get('/oembed', auth, getOEmbedDetails);

module.exports = router;