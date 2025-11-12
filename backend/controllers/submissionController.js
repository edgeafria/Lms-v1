// In: backend/controllers/submissionController.js
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Course = require('../models/Course'); 
const Enrollment = require('../models/Enrollment'); 
const Lesson = require('../models/Lesson'); 
const User = require('../models/User'); // <-- 1. IMPORT USER
const Activity = require('../models/Activity'); // <-- 2. IMPORT ACTIVITY
const achievementService = require('../services/achievementService'); // <-- 3. IMPORT SERVICE
const mongoose = require('mongoose');

// @desc    Get a student's submission for a specific lesson
// @route   GET /api/submissions?lessonId=...
// @access  Private (Student)
exports.getSubmission = async (req, res, next) => {
  // (This function is unchanged)
  try {
    const { lessonId } = req.query;
    const studentId = req.user.userId;

    if (!lessonId) {
      return res.status(400).json({ success: false, message: 'Lesson ID is required' });
    }

    const submission = await AssignmentSubmission.findOne({
      lesson: lessonId,
      student: studentId
    });

    if (!submission) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: submission });

  } catch (error) {
    console.error('Get submission error:', error);
    next(error);
  }
};

// @desc    Create or update an assignment submission
// @route   POST /api/submissions
// @access  Private (Student)
exports.submitAssignment = async (req, res, next) => {
  try {
    const { lessonId, courseId, content } = req.body;
    const studentId = req.user.userId;

    if (!lessonId || !courseId || !content) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // --- 🐞 4. FETCH USER ---
    const user = await User.findById(studentId).select('earnedAchievements');
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    // --- END FIX ---

    // Use findOneAndUpdate with 'upsert'
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { lesson: lessonId, student: studentId }, // Find by this
      {
        $set: {
          course: courseId,
          content: content,
          status: 'submitted', 
          submittedAt: Date.now()
        }
      },
      {
        new: true, 
        upsert: true, 
        runValidators: true
      }
    );

    // --- 🐞 5. CHECK ACHIEVEMENTS (in memory) ---
    const newAchievements = await achievementService.checkAssignmentAchievements(user);
    
    // --- 🐞 6. SAVE USER (if changed) ---
    if (newAchievements.length > 0) {
        await user.save();
    }
    // --- END FIX ---

    // --- 🐞 7. LOG ACTIVITY (fire and forget) ---
    // Log the assignment submission
    Activity.create({
        user: studentId,
        type: 'QUIZ_ATTEMPT', // You might want to create an 'ASSIGNMENT_SUBMITTED' type
        message: `You submitted an assignment for lesson: ${submission.lesson?.title || 'Lesson'}`,
        course: courseId,
        lesson: lessonId
    }).catch(err => console.error("Failed to log assignment activity:", err));

    // Log any new achievements
    newAchievements.forEach(ach => {
        Activity.create({
          user: user._id,
          type: 'CERTIFICATE_EARNED', 
          message: `You earned an achievement: ${ach.title}!`,
          course: courseId
        }).catch(err => console.error("Failed to log achievement activity:", err));
    });
    // --- END FIX ---

    res.status(201).json({ success: true, data: submission });

  } catch (error) {
    console.error('Submit assignment error:', error);
    next(error);
  }
};


// ===============================================
// --- INSTRUCTOR FUNCTIONS (Unchanged) ---
// ===============================================

/**
 * @desc    Get all pending submissions for the logged-in instructor
 * @route   GET /api/submissions/instructor
 * @access  Private (Instructor/Admin)
 */
exports.getInstructorSubmissions = async (req, res, next) => {
  try {
    // 1. Find all courses taught by this instructor
    const courses = await Course.find({ instructor: req.user.userId }).select('_id');
    if (!courses || courses.length === 0) {
      return res.status(200).json({ success: true, data: [] }); // No courses, so no submissions
    }
    const courseIds = courses.map(c => c._id);

    // 2. Find all 'submitted' (pending) submissions for those courses
    const submissions = await AssignmentSubmission.find({
      course: { $in: courseIds },
      status: 'submitted' 
    })
    .populate('student', 'name email avatar')
    .populate('lesson', 'title')
    .populate('course', 'title')
    .sort({ submittedAt: 'asc' }); // Show oldest first

    res.status(200).json({ success: true, data: submissions });

  } catch (error) {
    console.error('Get instructor submissions error:', error);
    next(error);
  }
};

/**
 * @desc    Get all submissions for a course (for instructor)
 * @route   GET /api/submissions/course/:courseId
 * @access  Private (Instructor/Admin)
 */
exports.getSubmissionsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query; // Filter by status (e.g., 'pending', 'graded')

    // 1. Check if course exists and instructor owns it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view submissions for this course' });
    }

    // 2. Build filter
    const filter = { course: courseId };
    if (status && ['pending', 'submitted', 'graded'].includes(status)) {
      filter.status = status;
    }

    // 3. Find submissions and populate with student/lesson details
    const submissions = await AssignmentSubmission.find(filter)
      .populate('student', 'name email avatar')
      .populate('lesson', 'title')
      .sort({ submittedAt: -1 }); // Show newest first

    res.status(200).json({ success: true, data: submissions });

  } catch (error) {
    console.error('Get submissions for course error:', error);
    next(error);
  }
};


/**
 * @desc    Get a single submission by its ID (for grading)
 * @route   GET /api/submissions/:submissionId
 * @access  Private (Instructor/Admin)
 */
exports.getSubmissionById = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return res.status(400).json({ success: false, message: 'Invalid submission ID' });
    }

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('student', 'name email avatar')
      .populate('lesson', 'title content.assignment.instructions')
      .populate('course', 'instructor');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // 1. Check ownership
    const course = submission.course;
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this submission' });
    }

    res.status(200).json({ success: true, data: submission });

  } catch (error) {
    console.error('Get submission by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Grade (Pass/Fail) an assignment submission
 * @route   PUT /api/submissions/:submissionId/grade
 * @access  Private (Instructor/Admin)
 */
exports.gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    
    // --- FIX 1: Expect 'grade' (number) to match frontend ---
    const { grade, feedback } = req.body; 

    if (grade === undefined) {
      return res.status(400).json({ success: false, message: 'Grade (0 or 1) is required' });
    }
    // ----------------------------------------------------

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('course', 'instructor');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // 1. Check ownership
    const course = submission.course;
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to grade this submission' });
    }

    // 2. Update the submission
    submission.grade = grade; // --- FIX 1: Use 'grade' directly ---
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedAt = Date.now();

    await submission.save();
    
    res.status(200).json({ success: true, data: submission });

  } catch (error) {
    console.error('Grade submission error:', error);
    next(error);
  }
};