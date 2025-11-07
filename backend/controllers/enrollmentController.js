// [COMPLETE CODE FOR: backend/controllers/enrollmentController.js]

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Activity = require('../models/Activity');
const achievementService = require('../services/achievementService'); 
const { validationResult } = require('express-validator');

// @desc    Get enrollments (filtered for student or admin)
// @route   GET /api/enrollments
// @access  Private (Student/Admin)
exports.getAll = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10, courseId } = req.query;
        let filter = {};

        // Students see only their own enrollments
        if (req.user.role === 'student') {
            filter.student = req.user.userId;
            if (status && ['active', 'completed'].includes(status)) {
                filter.status = status;
            }
        }
        // Admins can see all
        else if (req.user.role === 'admin') {
            if (courseId) filter.course = courseId;
            if (status) filter.status = status;
        } else {
            return res.status(403).json({ success: false, message: 'Access denied for this role' });
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const enrollments = await Enrollment.find(filter)
            .populate('course', 'title thumbnail slug category level instructor')
            .populate({
                path: 'course',
                populate: { path: 'instructor', select: 'name avatar' }
             })
             .populate({
                path: 'assignments.assignment',
                model: 'Assignment',
                select: 'title dueDate'
             })
             .populate(req.user.role === 'admin' ? { path: 'student', select: 'name email' } : '')
            .sort({ enrolledAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Enrollment.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: enrollments,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                total
            }
        });
    } catch (error) {
        console.error('Get enrollments error:', error);
        next(error);
    }
};

// @desc    Get single enrollment details
// @route   GET /api/enrollments/:id
// @access  Private (Owner/Admin)
exports.getOne = async (req, res, next) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate('course')
            .populate('student', 'name email avatar')
            .populate('progress.completedLessons.lesson', 'title order')
            .populate({
                path: 'assignments.assignment',
                model: 'Assignment',
                select: 'title dueDate instructions'
            });

        if (!enrollment) {
            // THIS IS THE LINE I FIXED
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        if (enrollment.student._id.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view this enrollment' });
        }

        res.status(200).json({
            success: true,
            data: enrollment
        });
    } catch (error) {
        console.error('Get single enrollment error:', error);
        next(error);
    }
};


// @desc    Create new enrollment (Enroll student in a course)
// @route   POST /api/enrollments
// @access  Private (Student)
exports.create = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        if (req.user.role !== 'student') {
             return res.status(403).json({ success: false, message: 'Only students can enroll using this endpoint. Admins/Instructors should use a different mechanism.' });
        }

        const { courseId, enrollmentType = 'paid' } = req.body;
        const studentId = req.user.userId;

        const course = await Course.findById(courseId);
        if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
        if (course.status !== 'published') { return res.status(400).json({ success: false, message: 'Course is not available for enrollment' }); }

        const existingEnrollment = await Enrollment.findOne({ student: studentId, course: courseId });
        if (existingEnrollment) { return res.status(400).json({ success: false, message: 'You are already enrolled in this course' }); }

        if (course.price > 0 && enrollmentType === 'paid') {
            console.log(`Enrollment initiated for paid course: ${courseId} by student: ${studentId}. Payment verification simulation.`);
        }

        const enrollment = new Enrollment({
            student: studentId,
            course: courseId,
            enrollmentType: course.price === 0 ? 'free' : enrollmentType,
            status: 'active',
        });
        await enrollment.save();

        course.enrollmentCount = (course.enrollmentCount || 0) + 1;
        await course.save();

        // --- 2. RECORD ACTIVITY ---
        try {
            await Activity.create({
                user: studentId,
                type: 'ENROLLMENT',
                message: `You enrolled in the course: ${course.title}`,
                course: courseId,
            });
            console.log(`Activity logged: User ${studentId} enrolled in course ${courseId}`);
        } catch (activityError) {
            console.error('Failed to log enrollment activity:', activityError);
        }
        
        // --- 3. CHECK FOR ACHIEVEMENTS ---
        // Run this in the background (no await) so it doesn't block the response
        if (achievementService.checkEnrollmentAchievements && typeof achievementService.checkEnrollmentAchievements === 'function') {
            achievementService.checkEnrollmentAchievements(studentId);
        }
        // ---------------------------------

        await enrollment.populate('course', 'title thumbnail');
        res.status(201).json({ success: true, message: 'Successfully enrolled in the course', data: enrollment });

    } catch (error) {
        if (error.code === 11000) { return res.status(400).json({ success: false, message: 'You are already enrolled in this course (duplicate check)' }); }
        console.error('Enrollment creation error:', error);
        next(error);
    }
};

// @desc    Update enrollment (e.g., status by admin)
// @route   PUT /api/enrollments/:id
// @access  Private (Admin)
exports.update = async (req, res, next) => {
    try {
         if (req.user.role !== 'admin') {
              return res.status(403).json({ success: false, message: 'Only admins can directly update enrollment records.' });
         }
        const { status } = req.body;
        const allowedUpdates = { status };
        const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true, runValidators: true });
        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }
        res.status(200).json({ success: true, message: 'Enrollment updated', data: enrollment });
    } catch (error) {
        console.error('Update enrollment error:', error);
        next(error);
    }
};

// @desc    Delete enrollment (Admin)
// @route   DELETE /api/enrollments/:id
// @access  Private (Admin)
exports.remove = async (req, res, next) => {
    try {
         if (req.user.role !== 'admin') {
              return res.status(403).json({ success: false, message: 'Only admins can delete enrollment records.' });
         }
        const enrollment = await Enrollment.findById(req.params.id);
        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }
        const courseId = enrollment.course;
        await enrollment.deleteOne();
        const course = await Course.findById(courseId);
        if (course) {
             course.enrollmentCount = await Enrollment.countDocuments({ course: courseId });
             await course.save();
        }
        res.status(200).json({ success: true, message: 'Enrollment deleted successfully' });
    } catch (error) {
        console.error('Delete enrollment error:', error);
        next(error);
    }
};


// @desc    Mark a lesson as complete
// @route   POST /api/enrollments/:id/complete-lesson
// @access  Private (Student Owner)
exports.completeLesson = async (req, res, next) => {
     try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { 
             console.warn("⚠️ [VALIDATION WARNING] completeLesson received non-validated data:", errors.array());
        }

        const { lessonId } = req.body;
        let { timeSpent } = req.body;
        
        const finalTimeSpent = typeof timeSpent === 'number' && timeSpent >= 0 ? timeSpent : 0;
        const enrollmentId = req.params.id;

        // --- 1. Basic Checks ---
        const enrollmentCheck = await Enrollment.findById(enrollmentId).select('student status course');
        if (!enrollmentCheck) { return res.status(404).json({ success: false, message: 'Enrollment not found' }); }
        if (enrollmentCheck.student.toString() !== req.user.userId.toString()) { return res.status(403).json({ success: false, message: 'Not authorized to update this enrollment' }); }
        // Allow completion even if status is 'completed', to handle re-syncing
        // if (enrollmentCheck.status !== 'active') { return res.status(400).json({ success: false, message: 'Enrollment is not active' }); }

        const courseId = enrollmentCheck.course.toString(); 
        const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
        if (!lesson) { 
             return res.status(404).json({ success: false, message: 'Lesson not found in this course' }); 
        }

        // --- 2. Database Operation: Atomically Add Lesson and Time ---
        // $addToSet ensures no duplicates, fixing the 7/6 issue.
        const updateResult = await Enrollment.updateOne(
            { _id: enrollmentId },
            { 
                $addToSet: { 
                    'progress.completedLessons': { lesson: lessonId, completedAt: new Date(), timeSpent: finalTimeSpent } 
                },
                $inc: { 'progress.totalTimeSpent': finalTimeSpent } 
            }
        );

        if (updateResult.modifiedCount > 0) {
            console.log(`✅ Lesson ${lessonId} newly added to completed list.`);
        } else {
            console.log(`ℹ️ Lesson ${lessonId} already completed. Skipping add.`);
        }
        
        // --- 3. Database Query: Fetch Total Lessons (Denominator) ---
        // This is the source of truth for the denominator.
        const totalLessons = await Lesson.countDocuments({ course: courseId });
        await Course.findByIdAndUpdate(courseId, { totalLessons: totalLessons }); // Update course document total
        
        // --- 4. Database Query: Re-fetch Enrollment to get FINAL completed count (Numerator) ---
        // This is the source of truth for the numerator.
        const updatedEnrollment = await Enrollment.findById(enrollmentId);
        if (!updatedEnrollment) { return res.status(404).json({ success: false, message: 'Enrollment not found after update' }); }
        
        const completedLessonsCount = updatedEnrollment.progress.completedLessons.length;
        
        // --- 5. Database Update: Calculate Percentage and Status ---
        let calculatedPercentage = 0;
        if (totalLessons > 0) {
            calculatedPercentage = (completedLessonsCount / totalLessons) * 100;
        }

        // Cap the value at 100 before saving to prevent Mongoose validation errors.
        const finalPercentage = Math.min(100, calculatedPercentage);
        
        let statusUpdate = {};
        let logMessage = "Lesson marked as complete";
        
        // Check if course is now complete
        if (totalLessons > 0 && completedLessonsCount === totalLessons && updatedEnrollment.status !== 'completed') {
             statusUpdate = { status: 'completed', completedAt: new Date() };
             logMessage = "Course completed and lesson marked complete";
             
             if (achievementService.checkCourseCompletionAchievements && typeof achievementService.checkCourseCompletionAchievements === 'function') {
                 achievementService.checkCourseCompletionAchievements(updatedEnrollment.student, courseId);
             }
        } else if (updatedEnrollment.status === 'completed' && completedLessonsCount < totalLessons) {
            // Revert status if new lessons were added
            statusUpdate = { status: 'active', completedAt: undefined };
            logMessage = "Course progress updated";
        }
        
        // Final atomic update for percentage and status
        await Enrollment.updateOne(
            { _id: enrollmentId },
            { 
                $set: { 
                    'progress.percentageComplete': finalPercentage, 
                    ...statusUpdate
                } 
            }
        );
        
        // --- 7. Activity & Other Achievements ---
        if (updateResult.modifiedCount > 0) { // Only log activity if lesson was newly added
            try {
                await Activity.create({
                    user: updatedEnrollment.student,
                    type: 'LESSON_COMPLETE',
                    message: `You completed the lesson: ${lesson.title}`,
                    course: courseId,
                    lesson: lessonId,
                });
            } catch (activityError) {
                console.error('Failed to log lesson completion activity:', activityError);
            }
            
            if (achievementService.checkLessonAchievements && typeof achievementService.checkLessonAchievements === 'function') {
                achievementService.checkLessonAchievements(updatedEnrollment.student);
            }
        }

        // --- 8. Final Response ---
        // We re-fetch one last time to ensure the returned data has the new status
        const finalEnrollment = await Enrollment.findById(enrollmentId);
        
        res.status(200).json({
             success: true,
             message: logMessage,
             data: {
                enrollment: finalEnrollment,     // Source of COMPLETED count (numerator)
                totalLessons: totalLessons      // Source of TOTAL count (denominator)
             }
        });

     } catch (error) {
         console.error('Complete lesson error:', error);
         next(error); 
     }
};


// ### THIS IS THE NEW TEMPORARY FUNCTION ###
// @desc    Resets the progress for a specific enrollment
// @route   GET /api/enrollments/fix-my-data
// @access  Public (Temporary)
exports.fixMyData = async (req, res, next) => {
  try {
    const enrollmentId = "6901e453a4f8b98a068b85f1"; // The bad enrollment ID from your logs
    console.log(`[FIX DATA] Attempting to reset enrollment: ${enrollmentId}`);
    
    const result = await Enrollment.updateOne(
      { "_id": enrollmentId },
      { 
        $set: { 
          "progress.completedLessons": [], // Clears the array
          "progress.percentageComplete": 0,
          "status": "active"
        },
        $unset: {
          "completedAt": "" // Removes the completion date field
        }
      }
    );
    
    console.log("[FIX DATA] Result:", result);
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Enrollment ID not found. Did you copy the right ID from the logs?",
        enrollmentId: enrollmentId
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Data reset successfully. Please REMOVE this route from your router file now.",
      data: result 
    });

  } catch (error) {
    console.error("[FIX DATA] Error:", error);
    next(error);
  }
};