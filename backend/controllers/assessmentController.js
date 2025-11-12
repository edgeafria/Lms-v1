const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const mongoose = require('mongoose');

// @desc    Get stats for all assessments (Quizzes & Assignments)
// @route   GET /api/assessments/stats
// @access  Private (Admin)
exports.getAssessmentStats = async (req, res, next) => {
  try {
    // 1. Get all lessons that are assessments
    const lessons = await Lesson.find({
      type: { $in: ['quiz', 'assignment'] }
    })
    .populate({
      path: 'course',
      select: 'title instructor',
      populate: {
        path: 'instructor',
        select: 'name'
      }
    })
    .lean(); // Use .lean() for faster, plain JS objects

    // 2. Get all assignment submissions
    const submissions = await AssignmentSubmission.find({
      status: { $in: ['submitted', 'graded'] }
    }).lean();

    // 3. Get all quiz attempts (this is a bit heavy, but necessary)
    const quizAttemptsData = await Enrollment.aggregate([
      { $match: { "quizAttempts.0": { $exists: true } } }, // Only get enrollments with quiz attempts
      { $unwind: "$quizAttempts" },
      { $unwind: "$quizAttempts.attempts" },
      {
        $project: {
          _id: 0,
          quizId: "$quizAttempts.quiz",
          passed: "$quizAttempts.attempts.passed"
        }
      }
    ]);

    // 4. Process the data in JavaScript for easier merging

    // Create a map for assignment stats
    const assignmentStatsMap = new Map();
    for (const sub of submissions) {
      const lessonId = sub.lesson.toString();
      if (!assignmentStatsMap.has(lessonId)) {
        assignmentStatsMap.set(lessonId, { pending: 0, passed: 0, failed: 0 });
      }
      const stats = assignmentStatsMap.get(lessonId);
      
      if (sub.status === 'submitted') {
        stats.pending += 1;
      } else if (sub.status === 'graded') {
        if (sub.grade === 1) { // Based on your 'CoursePlayer' logic (1 = Pass)
          stats.passed += 1;
        } else {
          stats.failed += 1;
        }
      }
    }

    // Create a map for quiz stats
    const quizStatsMap = new Map();
    for (const attempt of quizAttemptsData) {
      const quizId = attempt.quizId.toString();
      if (!quizStatsMap.has(quizId)) {
        quizStatsMap.set(quizId, { passed: 0, failed: 0 });
      }
      const stats = quizStatsMap.get(quizId);
      if (attempt.passed) {
        stats.passed += 1;
      } else {
        stats.failed += 1;
      }
    }

    // 5. Combine all data
    const finalStats = lessons.map(lesson => {
      const lessonStats = {
        lessonId: lesson._id,
        title: lesson.title,
        type: lesson.type,
        courseId: lesson.course?._id,
        courseTitle: lesson.course?.title || 'N/A',
        instructorName: lesson.course?.instructor?.name || 'N/A',
        pending: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
      };

      if (lesson.type === 'assignment') {
        const stats = assignmentStatsMap.get(lesson._id.toString());
        if (stats) {
          lessonStats.pending = stats.pending;
          lessonStats.passed = stats.passed;
          lessonStats.failed = stats.failed;
        }
      } else if (lesson.type === 'quiz' && lesson.content?.quiz) {
        const stats = quizStatsMap.get(lesson.content.quiz.toString());
        if (stats) {
          lessonStats.passed = stats.passed;
          lessonStats.failed = stats.failed;
        }
      }
      
      const totalGraded = lessonStats.passed + lessonStats.failed;
      if (totalGraded > 0) {
        lessonStats.passRate = Math.round((lessonStats.passed / totalGraded) * 100);
      }

      return lessonStats;
    });

    res.status(200).json({
      success: true,
      data: finalStats,
    });

  } catch (error) {
    next(error);
  }
};