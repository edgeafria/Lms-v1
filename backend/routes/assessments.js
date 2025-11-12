const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// @route   GET /api/assessments/stats
// @desc    Get stats for all assessments
// @access  Private (Admin)
router.get(
  '/stats',
  auth,
  authorize(['admin']),
  assessmentController.getAssessmentStats
);

module.exports = router;