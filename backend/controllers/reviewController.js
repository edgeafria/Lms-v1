const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const User = require('../models/User'); // <-- 1. IMPORT USER
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
    // (This function is unchanged)
    try {
        const { courseId, studentId, page = 1, limit = 10, sort = 'createdAt' } = req.query;
        let filter = {};

        if (req.user.role === 'instructor') {
            const instructorCourses = await Course.find({ instructor: req.user.userId }).select('_id');
            const courseIds = instructorCourses.map(c => c._id);
            filter.course = { $in: courseIds };
            if (courseId) {
                if (courseIds.some(id => id.equals(courseId))) {
                    filter.course = courseId;
                } else {
                    filter.course = { $in: [] };
                }
            }
        } else if (req.user.role === 'student') {
            if (studentId && req.user.userId.toString() === studentId) {
                filter.student = studentId;
            } else if (courseId) {
                filter.course = courseId;
            } else {
                 return res.status(403).json({ success: false, message: 'Students can only view their own reviews or reviews for a specific course.' });
            }
        } else if (req.user.role === 'admin') {
            if (courseId) filter.course = courseId;
            if (studentId) filter.student = studentId;
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        
        let sortOption = { createdAt: -1 }; 
        if (sort === 'rating_high') sortOption = { rating: -1, createdAt: -1 };
        if (sort === 'rating_low') sortOption = { rating: 1, createdAt: -1 };

        const reviews = await Review.find(filter)
            .populate('student', 'name avatar') 
            .populate('course', 'title slug') 
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
    // (This function is unchanged)
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

        // --- 🐞 2. FETCH ALL DATA IN PARALLEL ---
        const [course, enrollment, user] = await Promise.all([
            Course.findById(courseId),
            Enrollment.findOne({ student: studentId, course: courseId }),
            User.findById(studentId).select('earnedAchievements') // Get user for achievements
        ]);
        // --- END FIX ---

        if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
        if (!user) { return res.status(404).json({ success: false, message: 'User not found' }); }
        if (!enrollment) { return res.status(403).json({ success: false, message: 'You must be enrolled in this course to leave a review.' }); }

        const review = new Review({ student: studentId, course: courseId, rating, comment });
        
        // --- 🐞 3. SAVE REVIEW (triggers hook) ---
        await review.save(); 
        // The Review.js model hook now handles updating the course rating & reviews array

        // --- 🐞 4. CHECK FOR ACHIEVEMENTS (in memory) ---
        const newAchievements = await achievementService.checkReviewAchievements(user);

        // --- 🐞 5. SAVE USER (if changed) ---
        if (newAchievements.length > 0) {
            await user.save();
        }
        // --- END FIX ---

        // --- 🐞 6. LOG ACTIVITY (fire and forget) ---
        Activity.create({
            user: studentId,
            type: 'REVIEW_SUBMITTED',
            message: `You left a ${rating}-star review for: ${course.title}`,
            course: courseId,
        }).catch(err => console.error('Failed to log review activity:', err));
        
        newAchievements.forEach(ach => {
            Activity.create({
              user: user._id,
              type: 'CERTIFICATE_EARNED', // Or 'ACHIEVEMENT'
              message: `You earned an achievement: ${ach.title}!`,
              course: courseId
            }).catch(err => console.error("Failed to log achievement activity:", err));
        });
        // --- END FIX ---

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
    // (This function is unchanged)
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
        await review.save(); // Post-save hook will recalculate ratings
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
    // (This function is unchanged)
    try {
        const review = await Review.findById(req.params.id);
        if (!review) { return res.status(404).json({ success: false, message: 'Review not found' }); }
        if (review.student.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
        }
        
        // The Review.js model hook handles updating the course
        await Review.findOneAndDelete({ _id: req.params.id }); 
        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error("Delete Review Error:", error);
        next(error);
    }
};


// --- Helper Functions for Webhooks (Unchanged) ---
async function fulfillOrder(userId, courseId, gateway, transactionId, amount, currency) {
    try {
        let enrollment = await Enrollment.findOne({ student: userId, course: courseId });
        if (enrollment) {
            console.log(`Webhook: Enrollment already exists for user ${userId}, course ${courseId}.`);
            await Payment.findOneAndUpdate({ student: userId, course: courseId, transactionId: transactionId, status: 'pending' }, { status: 'successful' });
            return;
        }
        await Payment.findOneAndUpdate(
             { student: userId, course: courseId, transactionId: transactionId },
             { student: userId, course: courseId, amount: amount, currency: currency.toUpperCase(), paymentGateway: gateway, transactionId: transactionId, status: 'successful' },
             { upsert: true, new: true, runValidators: true }
        );
        console.log(`Webhook: Payment record created/updated for user ${userId}, course ${courseId}, txn ${transactionId}`);
        enrollment = new Enrollment({ student: userId, course: courseId, status: 'active', enrollmentType: amount > 0 ? 'paid' : 'free' });
        await enrollment.save();
        console.log(`Webhook: Enrollment record created for user ${userId}, course ${courseId}`);
        const course = await Course.findById(courseId);
        if (course) { course.enrollmentCount = (course.enrollmentCount || 0) + 1; await course.save(); console.log(`Webhook: Course enrollment count updated for ${courseId}`); }
    } catch (error) {
         if (error.code === 11000) { console.warn(`Webhook: Attempted to create duplicate enrollment/payment for user ${userId}, course ${courseId}.`); }
         else { console.error(`Webhook fulfillOrder Error for txn ${transactionId}:`, error); }
    }
}

async function updatePaymentStatus(userId, gateway, transactionId, status) {
     try {
          await Payment.findOneAndUpdate( { student: userId, paymentGateway: gateway, transactionId: transactionId }, { status: status } );
          console.log(`Webhook: Payment status updated to '${status}' for user ${userId}, txn ${transactionId}`);
     } catch (error) { console.error(`Webhook updatePaymentStatus Error for txn ${transactionId}:`, error); }
}

// Placeholder for getPayments
exports.getPayments = async (req, res, next) => {
     if(!req.user || req.user.role !== 'admin') { return res.status(403).json({ success: false, message: 'Access Denied'}); }
     res.status(501).json({ success: false, message: 'Get All Payments (Admin) not implemented yet' });
};