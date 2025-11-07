// In: backend/routes/submissions.js
const express = require('express');
const router = express.Router();
const { 
  getSubmission, 
  submitAssignment,
  getInstructorSubmissions, // <-- NEW
  getSubmissionsForCourse,  // <-- NEW (We'll keep it)
  getSubmissionById,        // <-- NEW
  gradeSubmission           // <-- NEW
} = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// ===============================================
// --- STUDENT ROUTES ---
// ===============================================

// @route   GET /api/submissions?lessonId=...
// @desc    Get the current student's submission for a lesson
// @access  Private (Student)
router.get('/', auth, authorize(['student']), getSubmission);

// @route   POST /api/submissions
// @desc    Create or update a submission
// @access  Private (Student)
router.post('/', auth, authorize(['student']), submitAssignment); 

// ===============================================
// --- INSTRUCTOR ROUTES ---
// ===============================================

// @route   GET /api/submissions/instructor
// @desc    Get all pending submissions for the logged-in instructor
// @access  Private (Instructor/Admin)
router.get(
  '/instructor',
  auth,
  authorize(['instructor', 'admin']),
  getInstructorSubmissions
);

// @route   GET /api/submissions/course/:courseId
// @desc    Get all submissions for a specific course
// @access  Private (Instructor/Admin)
router.get(
  '/course/:courseId', 
  auth, 
  authorize(['instructor', 'admin']), 
  getSubmissionsForCourse
);

// @route   GET /api/submissions/:submissionId
// @desc    Get a single submission by its ID
// @access  Private (Instructor/Admin)
router.get(
  '/:submissionId', 
  auth, 
  authorize(['instructor', 'admin']), 
  getSubmissionById
);

// @route   PUT /api/submissions/:submissionId/grade
// @desc    Grade a submission
// @access  Private (Instructor/Admin)
router.put(
  '/:submissionId/grade', 
  auth, 
  authorize(['instructor', 'admin']), 
  gradeSubmission
);

module.exports = router;