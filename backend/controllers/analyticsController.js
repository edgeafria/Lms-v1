const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// Helper to get date range
const getDateRange = (period) => {
    const end = new Date();
    let start;
    switch (period) {
        case '7d': start = new Date(); start.setDate(end.getDate() - 7); break;
        case '30d': start = new Date(); start.setMonth(end.getMonth() - 1); break;
        case '90d': start = new Date(); start.setMonth(end.getMonth() - 3); break;
        case 'all': default: start = new Date(0); break;
    }
    return { start, end };
};

// Helper auth check
const checkAuth = (req, roles = []) => {
    if (!req.user) { throw { statusCode: 401, message: 'Authentication required' }; }
    if (roles.length > 0 && !roles.includes(req.user.role)) { throw { statusCode: 403, message: `Access denied. Role (${req.user.role}) not authorized.` }; }
};

// @desc    Get dashboard analytics (Admin/Instructor)
// @route   GET /api/analytics?type=dashboard
// @access  Private (Admin/Instructor)
exports.getDashboardAnalytics = async (req, res, next) => {
    try {
        checkAuth(req, ['admin', 'instructor']);

        const { period = '30d' } = req.query;
        const { start, end } = getDateRange(period);
        
        let courseFilter = {};
        let enrollmentFilter = { createdAt: { $gte: start, $lte: end } };
        let paymentFilter = { status: 'successful', createdAt: { $gte: start, $lte: end } };
        let courseRatingFilter = { status: 'published', 'rating.count': { $gt: 0 } };
        let allTimeEnrollmentFilter = {};
        
        let instructorCountPromise = Promise.resolve(0); 
        if (req.user.role === 'admin') {
            instructorCountPromise = User.countDocuments({ role: 'instructor' });
        }


        if (req.user.role === 'instructor') {
            const instructorCourses = await Course.find({ instructor: req.user.userId }).select('_id');
            const courseIds = instructorCourses.map(c => c._id);
            
            courseFilter.instructor = req.user.userId; 
            enrollmentFilter.course = { $in: courseIds }; 
            allTimeEnrollmentFilter.course = { $in: courseIds }; 
            paymentFilter.course = { $in: courseIds }; 
            courseRatingFilter.instructor = req.user.userId; 
        }

        // --- Run all data queries in parallel ---
        const [
            totalCourses,
            newEnrollmentsCount, // <-- Renamed this
            revenueData,
            totalStudentsData,
            coursesForRating,
            engagementData, 
            quizData,
            totalInstructors,
            recentEnrollments, // <-- 🐞 1. ADDED THIS QUERY
            topCourses         // <-- 🐞 2. ADDED THIS QUERY
        ] = await Promise.all([
            // 1. Total Courses
            Course.countDocuments(courseFilter),
            // 2. New Enrollments (in period)
            Enrollment.countDocuments(enrollmentFilter), // <-- Keep this for the stat
            // 3. Total Revenue (in period)
            Payment.aggregate([
                { $match: paymentFilter },
                { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
            ]),
            // 4. Total Students (all-time, unique)
            req.user.role === 'admin'
                ? User.countDocuments({ role: 'student' })
                : Enrollment.distinct('student', allTimeEnrollmentFilter), 
            // 5. Average Rating
            Course.find(courseRatingFilter).select('rating.average'),
            // 6. Engagement Data
            Enrollment.aggregate([
                { $match: allTimeEnrollmentFilter },
                {
                    $group: {
                        _id: null,
                        avgCompletion: { $avg: "$progress.percentageComplete" },
                        totalTimeSpent: { $sum: "$progress.totalTimeSpent" } 
                    }
                }
            ]),
            // 7. Quiz Pass Rate
            Enrollment.aggregate([
                { $match: allTimeEnrollmentFilter }, 
                { $unwind: "$quizAttempts" }, 
                { $unwind: "$quizAttempts.attempts" }, 
                { $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    passedAttempts: {
                        $sum: { $cond: [ "$quizAttempts.attempts.passed", 1, 0 ] } 
                    }
                }}
            ]),
            // 8. Total Instructors
            instructorCountPromise,
            
            // --- 🐞 9. GET 4 RECENT ENROLLMENTS ---
            Enrollment.find(enrollmentFilter) // Use same period filter
                .sort({ createdAt: -1 })
                .limit(4)
                // --- 🐞 THIS IS THE ONLY LINE I CHANGED ---
                .populate('student', 'name avatar') // <-- Now requests 'avatar' object
                // ----------------------------------------
                .populate('course', 'title'),
                
            // --- 🐞 10. GET 4 TOP COURSES ---
            Course.find({ ...courseFilter, status: 'published' })
                .sort({ enrollmentCount: -1 })
                .limit(4)
                .select('title enrollmentCount rating.average')
        ]);

        // --- Process Results ---
        
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
        
        const totalStudents = req.user.role === 'admin'
            ? totalStudentsData
            : totalStudentsData.length; 
            
        const avgRating = coursesForRating.length > 0
            ? coursesForRating.reduce((sum, c) => sum + (c.rating.average || 0), 0) / coursesForRating.length
            : 0;

        const avgCompletionRate = engagementData.length > 0 ? (engagementData[0].avgCompletion || 0) : 0;
        const totalStudyTime = engagementData.length > 0 ? (engagementData[0].totalTimeSpent || 0) : 0; 

        let avgQuizPassRate = 0;
        if (quizData.length > 0 && quizData[0].totalAttempts > 0) {
            avgQuizPassRate = (quizData[0].passedAttempts / quizData[0].totalAttempts) * 100;
        }

        res.status(200).json({
            success: true,
            data: {
                period,
                totalStudents,
                totalCourses,
                newEnrollments: newEnrollmentsCount, // <-- Use the count here
                totalRevenue,
                avgRating: parseFloat(avgRating.toFixed(1)),
                avgCompletionRate: parseFloat(avgCompletionRate.toFixed(1)),
                totalStudyTime: Math.round(totalStudyTime), 
                avgQuizPassRate: parseFloat(avgQuizPassRate.toFixed(1)),
                totalInstructors: totalInstructors,
                recentEnrollments: recentEnrollments, // <-- 🐞 3. SEND NEW DATA
                topCourses: topCourses             // <-- 🐞 4. SEND NEW DATA
            }
        });

    } catch (error) {
        if (error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
        console.error("Get Dashboard Analytics Error:", error);
        next(error);
    }
};

// ... (rest of your file: getCourseStats, getRevenueAnalytics, etc. are unchanged) ...

// @desc    Get stats for a specific course
// @route   GET /api/analytics/:id (mapped from getOne)
// @access  Private (Owner/Admin)
exports.getCourseStats = async (req, res, next) => {
    try {
         checkAuth(req);
         const { period = '30d' } = req.query;
         const { start, end } = getDateRange(period);
         const courseId = req.params.id;

         if (!mongoose.Types.ObjectId.isValid(courseId)) {
             return res.status(400).json({ success: false, message: 'Invalid Course ID' });
         }

         const course = await Course.findById(courseId);
         if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }

         if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId.toString()) {
              return res.status(403).json({ success: false, message: 'Not authorized to view stats for this course' });
         }

         const enrollmentFilter = { course: courseId, createdAt: { $gte: start, $lte: end } };
         const paymentFilter = { course: courseId, status: 'successful', createdAt: { $gte: start, $lte: end } };
         const newEnrollments = await Enrollment.countDocuments(enrollmentFilter);
         const totalEnrollments = course.enrollmentCount || 0;
         const revenueData = await Payment.aggregate([{ $match: paymentFilter }, { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }]);
         const totalRevenuePeriod = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
         const averageRating = course.rating?.average || 0;
         const ratingCount = course.rating?.count || 0;
         
         res.status(200).json({
             success: true,
             data: { period, courseId, courseTitle: course.title, newEnrollments, totalEnrollments, totalRevenuePeriod, averageRating, ratingCount, views: course.analytics?.views || 0, }
         });
    } catch (error) {
         if (error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
        console.error("Get Course Stats Error:", error);
        next(error);
    }
};


// @desc    Get revenue analytics
// @route   GET /api/analytics?type=revenue
// @access  Private (Admin/Instructor)
exports.getRevenueAnalytics = async (req, res, next) => {
     try {
        checkAuth(req, ['admin', 'instructor']);
        const { period = '30d', courseId } = req.query;
        const { start, end } = getDateRange(period);
        let paymentFilter = { status: 'successful', createdAt: { $gte: start, $lte: end } };
        let instructorCourseIds = []; 

        if (req.user.role === 'instructor') {
            const instructorCourses = await Course.find({ instructor: req.user.userId }).select('_id');
            instructorCourseIds = instructorCourses.map(c => c._id); 
            paymentFilter.course = { $in: instructorCourseIds };
        }
        
        if (courseId) {
             if(req.user.role === 'instructor' && !instructorCourseIds.some(id => id.equals(courseId))) { 
                  return res.status(403).json({ success: false, message: 'Not authorized for this course revenue'});
             }
             if (!mongoose.Types.ObjectId.isValid(courseId)) {
                  return res.status(400).json({ success: false, message: 'Invalid Course ID' });
             }
             paymentFilter.course = new mongoose.Types.ObjectId(courseId); 
        }
        
        const revenueByCourse = await Payment.aggregate([ { $match: paymentFilter }, { $group: { _id: '$course', totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }, { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'courseDetails' } }, { $unwind: '$courseDetails' }, { $project: { _id: 0, courseId: '$_id', courseTitle: '$courseDetails.title', totalRevenue: 1, numberOfSales: '$count' } }, { $sort: { totalRevenue: -1 } } ]);
         const totalRevenueOverall = revenueByCourse.reduce((sum, item) => sum + item.totalRevenue, 0);
        
        res.status(200).json({ success: true, data: { period, filterCourseId: courseId || 'all', totalRevenue: totalRevenueOverall, revenueBreakdown: revenueByCourse } });
    } catch (error) {
         if (error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
        console.error("Get Revenue Analytics Error:", error);
        next(error);
    }
};

// @desc    Get student analytics (Admin Only)
// @route   GET /api/analytics?type=students
// @access  Private (Admin)
exports.getStudentAnalytics = async (req, res, next) => {
     try {
        checkAuth(req, ['admin']);
        const { period = '30d' } = req.query;
        const { start, end } = getDateRange(period);
        const newStudents = await User.countDocuments({ role: 'student', createdAt: { $gte: start, $lte: end } });
        const totalStudents = await User.countDocuments({ role: 'student' });
        const activeStudents = await Enrollment.distinct('student', { updatedAt: { $gte: start, $lte: end } });
        res.status(200).json({ success: true, data: { period, newStudents, totalStudents, activeStudentsCount: activeStudents.length, } });
    } catch (error) {
         if (error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
        console.error("Get Student Analytics Error:", error);
        next(error);
    }
};

// --- Mappings for your generic routes ---
exports.getAll = (req, res, next) => {
    const { type = 'dashboard' } = req.query;
    if (type === 'revenue') return exports.getRevenueAnalytics(req, res, next);
    if (type === 'students') return exports.getStudentAnalytics(req, res, next);
    // Default to dashboard
    return exports.getDashboardAnalytics(req, res, next);
};
exports.getOne = (req, res, next) => {
    // Assume ID is for a course
    exports.getCourseStats(req, res, next);
};
exports.create = (req, res) => { res.status(405).json({ success: false, message: 'Cannot POST to analytics' }); };
exports.update = (req, res) => { res.status(405).json({ success: false, message: 'Cannot PUT to analytics' }); };
exports.remove = (req, res) => { res.status(405).json({ success: false, message: 'Cannot DELETE analytics' }); };