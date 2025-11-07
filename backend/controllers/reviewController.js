const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const achievementService = require('../services/achievementService');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware-like function for authorization checks
const checkAuth = (req, roles = []) => {
    if (!req.user) { throw { statusCode: 401, message: 'Authentication required' }; }
    if (roles.length > 0 && !roles.includes(req.user.role)) { throw { statusCode: 403, message: `Access denied. Role (${req.user.role}) not authorized.` }; }
};

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Private (filtered by course/student/instructor)
exports.getAll = async (req, res, next) => {
    try {
        // Auth is guaranteed by the route middleware
        
        const { courseId, studentId, page = 1, limit = 10, sort = 'createdAt' } = req.query;
        let filter = {};

        // --- NEW INSTRUCTOR LOGIC ---
        if (req.user.role === 'instructor') {
            // Find all courses taught by this instructor
            const instructorCourses = await Course.find({ instructor: req.user.userId }).select('_id');
            const courseIds = instructorCourses.map(c => c._id);
            
            // Filter reviews to only include those for the instructor's courses
            filter.course = { $in: courseIds };

            // Allow instructor to further filter by a specific course they own
            if (courseId) {
                // Ensure the requested courseId is one they actually own
                if (courseIds.some(id => id.equals(courseId))) {
                    filter.course = courseId; // Refine filter to the specific course
                } else {
                    // If they request a courseId they don't own, return no reviews
                    filter.course = { $in: [] }; // Effectively returns empty
                }
            }
        // --- END INSTRUCTOR LOGIC ---

        } else if (req.user.role === 'student') {
            // Students can only see their own reviews, or reviews for a specific course
            if (studentId && req.user.userId.toString() === studentId) {
                filter.student = studentId; // Show only their own
            } else if (courseId) {
                filter.course = courseId; // Show all for a course
            } else {
                 // Student asking for all reviews or another student's reviews
                 return res.status(403).json({ success: false, message: 'Students can only view their own reviews or reviews for a specific course.' });
            }
        } else if (req.user.role === 'admin') {
            // Admin can filter by any course or student
            if (courseId) filter.course = courseId;
            if (studentId) filter.student = studentId;
            // If no filter, admin gets all
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        
        let sortOption = { createdAt: -1 }; // Default: newest first
        if (sort === 'rating_high') sortOption = { rating: -1, createdAt: -1 };
        if (sort === 'rating_low') sortOption = { rating: 1, createdAt: -1 };

        const reviews = await Review.find(filter)
            .populate('student', 'name avatar') // Get student info
            .populate('course', 'title slug') // Get course info
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum);
            
        const total = await Review.countDocuments(filter);

        res.status(200).json({
            success: true, data: reviews,
            pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), total }
        });
    } catch (error) {
        console.error("Get Reviews Error:", error);
        next(error);
    }
};

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Public
exports.getOne = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id).populate('student', 'name avatar').populate('course', 'title slug instructor');
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        console.error("Get Single Review Error:", error);
        next(error);
    }
};

// @desc    Create a new review for a course
// @route   POST /api/reviews
// @access  Private (Student - Enrolled)
exports.create = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }

        const { courseId, rating, comment } = req.body;
        const studentId = req.user.userId;

        const course = await Course.findById(courseId);
        if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
        const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
        if (!enrollment) { return res.status(403).json({ success: false, message: 'You must be enrolled in this course to leave a review.' }); }

        const review = new Review({ student: studentId, course: courseId, rating, comment });
        await review.save(); // Post-save hook updates course rating

        try {
            await Activity.create({
                user: studentId,
                type: 'REVIEW_SUBMITTED',
                message: `You left a ${rating}-star review for: ${course.title}`,
                course: courseId,
            });
            console.log(`Activity logged: User ${studentId} submitted review for course ${courseId}`);
        } catch (activityError) {
            console.error('Failed to log review activity:', activityError);
        }
        
        achievementService.checkReviewAchievements(studentId);

        await review.populate('student', 'name avatar');
        res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });

    } catch (error) {
        if (error.code === 11000) { return res.status(400).json({ success: false, message: 'You have already reviewed this course.' }); }
        console.error("Create Review Error:", error);
        next(error);
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Owner/Admin)
exports.update = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
        const { rating, comment } = req.body;
        const review = await Review.findById(req.params.id);
        if (!review) { return res.status(404).json({ success: false, message: 'Review not found' }); }
        if (review.student.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
        }
        review.rating = rating ?? review.rating;
        review.comment = comment ?? review.comment;
        await review.save(); // Post-save hook updates course rating
        await review.populate('student', 'name avatar');
        res.status(200).json({ success: true, message: 'Review updated successfully', data: review });
    } catch (error) {
        console.error("Update Review Error:", error);
        next(error);
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner/Admin)
exports.remove = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) { return res.status(404).json({ success: false, message: 'Review not found' }); }
        if (review.student.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
        }
        await Review.findOneAndDelete({ _id: req.params.id }); // Triggers pre/post hooks
        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error("Delete Review Error:", error);
        next(error);
    }
};