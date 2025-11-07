// In: backend/controllers/submissionController.js
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Course = require('../models/Course'); // <-- Make sure this is imported
const Enrollment = require('../models/Enrollment'); // <-- Make sure this is imported
const Lesson = require('../models/Lesson'); // <-- Make sure this is imported
const mongoose = require('mongoose');

// @desc    Get a student's submission for a specific lesson
// @route   GET /api/submissions?lessonId=...
// @access  Private (Student)
exports.getSubmission = async (req, res, next) => {
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

    // It's not an error if it's not found, it just means they haven't submitted
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

    // Use findOneAndUpdate with 'upsert' to create a new submission
    // or update an existing one.
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { lesson: lessonId, student: studentId }, // Find by this
      {
        $set: {
          course: courseId,
          content: content,
          status: 'submitted', // Set/reset status to 'submitted'
          submittedAt: Date.now()
        }
      },
      {
        new: true, // Return the updated or new document
        upsert: true, // Create it if it doesn't exist
        runValidators: true
      }
    );

    res.status(201).json({ success: true, data: submission });

  } catch (error) {
    console.error('Submit assignment error:', error);
    next(error);
  }
};


// ===============================================
// --- NEW INSTRUCTOR FUNCTIONS (Add these) ---
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
    const { passed, feedback } = req.body; // passed will be true or false

    if (passed === undefined) {
      return res.status(400).json({ success: false, message: 'Pass/Fail status (passed: true/false) is required' });
    }

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
    submission.grade = passed ? 1 : 0; // 1 = Pass, 0 = Fail
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedAt = Date.now();

    await submission.save();

    // 3. If passed, mark the lesson as complete for the student
    if (passed) {
      const enrollment = await Enrollment.findOneAndUpdate(
        { student: submission.student, course: submission.course },
        { 
          // $addToSet prevents duplicates if the lesson was already completed
          $addToSet: { 
            'progress.completedLessons': { lesson: submission.lesson } 
          } 
        },
        { new: true } // Return the updated enrollment
      );

      // Recalculate progress percentage
      if (enrollment) {
          const lessonCount = await Lesson.countDocuments({ course: submission.course });
          if (lessonCount > 0) {
              enrollment.progress.percentageComplete = (enrollment.progress.completedLessons.length / lessonCount) * 100;
          } else {
              enrollment.progress.percentageComplete = 0;
          }
          await enrollment.save();
      }
    }
    
    res.status(200).json({ success: true, data: submission });

  } catch (error) {
    console.error('Grade submission error:', error);
    next(error);
  }
};