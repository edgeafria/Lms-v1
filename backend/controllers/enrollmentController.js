// [COMPLETE CODE FOR: backend/controllers/enrollmentController.js]

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Activity = require('../models/Activity');
const User = require('../models/User'); // <-- 1. IMPORT USER MODEL
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

        // This populate was already correct from our last fix
        const enrollments = await Enrollment.find(filter)
            .populate('course', 'title thumbnail slug category level instructor accessPeriod')
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
            .populate('course') // <-- This full populate will include accessPeriod
            .populate('student', 'name email avatar')
            .populate('progress.completedLessons.lesson', 'title order')
            .populate({
                path: 'assignments.assignment',
                model: 'Assignment',
                select: 'title dueDate instructions'
            });

        if (!enrollment) {
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
             return res.status(403).json({ success: false, message: 'Only students can enroll using this endpoint.' });
        }

        const { courseId, enrollmentType = 'paid' } = req.body;
        const studentId = req.user.userId;

        // --- 🐞 2. FETCH USER AND COURSE DATA IN PARALLEL ---
        const [course, existingEnrollment, user] = await Promise.all([
            Course.findById(courseId),
            Enrollment.findOne({ student: studentId, course: courseId }),
            User.findById(studentId).select('earnedAchievements') // Get the user for achievements
        ]);
        // --- END FIX ---

        if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
        if (!user) { return res.status(404).json({ success: false, message: 'User not found' }); }
        if (course.status !== 'published') { return res.status(400).json({ success: false, message: 'Course is not available for enrollment' }); }
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
        
        course.enrollmentCount = (course.enrollmentCount || 0) + 1;

        // --- 🐞 3. CHECK FOR ACHIEVEMENTS (in memory) ---
        const newAchievements = await achievementService.checkEnrollmentAchievements(user);

        // --- 🐞 4. SAVE ALL CHANGES AT ONCE ---
        await Promise.all([
            enrollment.save(),
            course.save(),
            user.save() // This saves the user *with* the new achievements
        ]);
        // --- END FIX ---

        // --- 🐞 5. LOG ACTIVITY FOR ENROLLMENT AND ACHIEVEMENTS (fire and forget) ---
        Activity.create({
            user: studentId,
            type: 'ENROLLMENT',
            message: `You enrolled in the course: ${course.title}`,
            course: courseId,
        }).catch(err => console.error('Failed to log enrollment activity:', err));
        
        newAchievements.forEach(ach => {
            Activity.create({
              user: user._id,
              type: 'CERTIFICATE_EARNED', // Or 'ACHIEVEMENT' if you have it
              message: `You earned an achievement: ${ach.title}!`,
            }).catch(err => console.error("Failed to log achievement activity:", err));
        });
        // --- END FIX ---

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

        // --- 🐞 2. FETCH USER AND ENROLLMENT DATA ---
        const enrollmentCheck = await Enrollment.findById(enrollmentId).select('student status course');
        if (!enrollmentCheck) { return res.status(404).json({ success: false, message: 'Enrollment not found' }); }
        if (enrollmentCheck.student.toString() !== req.user.userId.toString()) { return res.status(403).json({ success: false, message: 'Not authorized to update this enrollment' }); }
        
        const courseId = enrollmentCheck.course.toString(); 
        
        const [lesson, user] = await Promise.all([
            Lesson.findOne({ _id: lessonId, course: courseId }),
            User.findById(req.user.userId).select('earnedAchievements') // Get user for achievements
        ]);
        // --- END FIX ---
        
        if (!lesson) { 
             return res.status(404).json({ success: false, message: 'Lesson not found in this course' }); 
        }

        // --- 3. Database Operation: Atomically Add Lesson and Time ---
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
        
        // --- 4. Database Query: Fetch Totals (Denominator & Numerator) ---
        const [totalLessons, updatedEnrollment] = await Promise.all([
            Lesson.countDocuments({ course: courseId }),
            Enrollment.findById(enrollmentId).select('progress.completedLessons status student')
        ]);
        
        if (!updatedEnrollment) { return res.status(404).json({ success: false, message: 'Enrollment not found after update' }); }
        
        await Course.findByIdAndUpdate(courseId, { totalLessons: totalLessons }); 
        const completedLessonsCount = updatedEnrollment.progress.completedLessons.length;
        
        // --- 5. Calculate Percentage and Status ---
        let calculatedPercentage = 0;
        if (totalLessons > 0) {
            calculatedPercentage = (completedLessonsCount / totalLessons) * 100;
        }

        const finalPercentage = Math.min(100, calculatedPercentage);
        
        let statusUpdate = {};
        let logMessage = "Lesson marked as complete";
        let newLessonAchievements = [];
        let newCourseAchievements = [];
        
        // --- 6. 🐞 CHECK FOR ACHIEVEMENTS (in memory) ---
        if (totalLessons > 0 && completedLessonsCount === totalLessons && updatedEnrollment.status !== 'completed') {
             statusUpdate = { status: 'completed', completedAt: new Date() };
             logMessage = "Course completed and lesson marked complete";
             
             if (achievementService.checkCourseCompletionAchievements) {
                 // Pass the user object, not just the ID
                 newCourseAchievements = await achievementService.checkCourseCompletionAchievements(user);
             }
        } else if (updatedEnrollment.status === 'completed' && completedLessonsCount < totalLessons) {
            statusUpdate = { status: 'active', completedAt: undefined };
            logMessage = "Course progress updated";
        }
        
        if (updateResult.modifiedCount > 0) { // Only check for lesson achievements if it was a new completion
            if (achievementService.checkLessonAchievements) {
                // Pass the user object
                newLessonAchievements = await achievementService.checkLessonAchievements(user);
            }
        }
        // --- END FIX ---
        
        // --- 7. 🐞 FINAL ATOMIC SAVE ---
        const allNewAchievements = [...newLessonAchievements, ...newCourseAchievements];
        
        // Save enrollment progress and user achievements at the same time
        await Promise.all([
            Enrollment.updateOne(
                { _id: enrollmentId },
                { 
                    $set: { 
                        'progress.percentageComplete': finalPercentage, 
                        ...statusUpdate
                    } 
                }
            ),
            allNewAchievements.length > 0 ? user.save() : Promise.resolve() // Only save user if changed
        ]);
        // --- END FIX ---
        
        // --- 8. Activity Logging (fire and forget) ---
        if (updateResult.modifiedCount > 0) { 
            Activity.create({
                user: updatedEnrollment.student,
                type: 'LESSON_COMPLETE',
                message: `You completed the lesson: ${lesson.title}`,
                course: courseId,
                lesson: lessonId,
            }).catch(err => console.error('Failed to log lesson completion activity:', err));
        }
        
        allNewAchievements.forEach(ach => {
            Activity.create({
              user: user._id,
              type: 'CERTIFICATE_EARNED', // Or 'ACHIEVEMENT'
              message: `You earned an achievement: ${ach.title}!`,
              course: ach.code === 'FIRST_COURSE_COMPLETE' ? courseId : null
            }).catch(err => console.error("Failed to log achievement activity:", err));
        });

        // --- 9. Final Response ---
        const finalEnrollment = await Enrollment.findById(enrollmentId);
        
        res.status(200).json({
             success: true,
             message: logMessage,
             data: {
                enrollment: finalEnrollment,     
                totalLessons: totalLessons      
             }
        });

     } catch (error) {
         console.error('Complete lesson error:', error);
         next(error); 
     }
};