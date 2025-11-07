const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Activity = require('../models/Activity');
const achievementService = require('../services/achievementService'); // <-- 1. Import Service
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware-like function for authorization checks within controllers
const checkAuth = (req, roles = []) => {
    if (!req.user) {
        throw { statusCode: 401, message: 'Authentication required' };
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
         throw { statusCode: 403, message: `Access denied. Role (${req.user.role}) not authorized.` };
    }
};


// @desc    Get Certificates (Student gets own, Admin gets filtered)
// @route   GET /api/certificates
// @access  Private (Student/Admin)
exports.getAll = async (req, res, next) => {
    try {
        checkAuth(req, ['student', 'admin']); // Auth check from route file
         const { page = 1, limit = 10, studentId, courseId } = req.query;
         let filter = {};
         if(req.user.role === 'student'){
              filter.student = req.user.userId;
         } else if (req.user.role === 'admin') {
              if(studentId) filter.student = studentId;
              if(courseId) filter.course = courseId;
         }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const certificates = await Certificate.find(filter).populate('course', 'title slug thumbnail').sort({ issuedAt: -1 }).skip(skip).limit(limitNum);
        const total = await Certificate.countDocuments(filter);
        res.status(200).json({
            success: true,
            data: certificates,
            pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), total }
        });
    } catch (error) {
        if(error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
        console.error("Get Certificates Error:", error);
        next(error);
    }
};

// @desc    Get single certificate details (by DB _id or unique certificateId string)
// @route   GET /api/certificates/:id
// @access  Private (Owner/Admin)
exports.getOne = async (req, res, next) => {
    try {
         checkAuth(req); // Auth check from route file
        const certificate = await Certificate.findOne({
             $or: [
                  { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null },
                  { certificateId: req.params.id }
             ]
        }).populate('student', 'name email').populate('course', 'title');
        if (!certificate) { return res.status(404).json({ success: false, message: 'Certificate not found' }); }
        if (certificate.student._id.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
             throw { statusCode: 403, message: 'Not authorized to view this certificate' };
        }
        res.status(200).json({ success: true, data: certificate });
    } catch (error) {
         if(error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
        console.error("Get Single Certificate Error:", error);
        next(error);
    }
};


// @desc    Generate/Create Certificate Record for a completed enrollment
// @route   POST /api/certificates
// @access  Private (Student/Admin)
exports.create = async (req, res, next) => {
    try {
        checkAuth(req, ['student', 'admin']); // Auth check from route file
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }

        const { enrollmentId } = req.body;
        const userId = req.user.userId;

        const enrollment = await Enrollment.findById(enrollmentId).populate('student', 'name').populate('course', 'title certificate');
        if (!enrollment) { return res.status(404).json({ success: false, message: 'Enrollment not found' }); }
        if (enrollment.student._id.toString() !== userId.toString() && req.user.role !== 'admin') { throw { statusCode: 403, message: 'Not authorized to generate certificate for this enrollment' }; }
        if (enrollment.status !== 'completed' || !enrollment.completedAt) { return res.status(400).json({ success: false, message: 'Course enrollment is not yet completed' }); }
        if (!enrollment.course.certificate?.enabled) { return res.status(400).json({ success: false, message: 'Certificates are not enabled for this course' }); }
        const existingCertificate = await Certificate.findOne({ enrollment: enrollmentId });
        if (existingCertificate) { return res.status(409).json({ success: false, message: 'Certificate already exists for this enrollment', data: existingCertificate }); }

        const certificate = new Certificate({
            student: enrollment.student._id, course: enrollment.course._id, enrollment: enrollmentId,
            courseTitle: enrollment.course.title, studentName: enrollment.student.name, completionDate: enrollment.completedAt,
            templateUsed: enrollment.course.certificate?.template,
        });
        await certificate.save();

        enrollment.certificate = { issued: true, certificateId: certificate.certificateId, issuedAt: certificate.issuedAt };
        await enrollment.save();

        // --- 3. RECORD ACTIVITY ---
        try {
            await Activity.create({
                user: enrollment.student._id,
                type: 'CERTIFICATE_EARNED',
                message: `You earned a certificate for: ${enrollment.course.title}`,
                course: enrollment.course._id,
            });
            console.log(`Activity logged: User ${enrollment.student._id} earned certificate for course ${enrollment.course._id}`);
        } catch (activityError) {
            console.error('Failed to log certificate activity:', activityError);
        }
        
        // --- 4. CHECK FOR ACHIEVEMENTS ---
        achievementService.checkCertificateAchievements(enrollment.student._id);
        // ---------------------------------

        res.status(201).json({ success: true, message: 'Certificate record created successfully', data: certificate });

    } catch (error) {
         if(error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
        console.error("Create Certificate Error:", error);
        next(error);
    }
};

// @desc    Update Certificate (Admin only?) - Placeholder
// @route   PUT /api/certificates/:id
// @access  Private (Admin)
exports.update = async (req, res, next) => {
     try {
         checkAuth(req, ['admin']);
         const allowedUpdates = {}; // Define updatable fields
         const certificate = await Certificate.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true });
         if(!certificate) return res.status(404).json({success: false, message: 'Certificate not found'});
         res.status(200).json({ success: true, message: 'Certificate updated (placeholder)', data: certificate });
     } catch(error){
          if(error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
         next(error);
     }
};

// @desc    Delete/Revoke Certificate (Admin only?) - Placeholder
// @route   DELETE /api/certificates/:id
// @access  Private (Admin)
exports.remove = async (req, res, next) => {
     try {
         checkAuth(req, ['admin']);
         const certificate = await Certificate.findById(req.params.id);
         if(!certificate) { return res.status(404).json({ success: false, message: 'Certificate not found' }); }
         await Enrollment.findByIdAndUpdate(certificate.enrollment, { $set: { 'certificate.issued': false, 'certificate.certificateId': null, 'certificate.issuedAt': null, 'certificate.pdfUrl': null } });
         await certificate.deleteOne();
         res.status(200).json({ success: true, message: 'Certificate deleted and enrollment updated' });
     } catch(error) {
          if(error.statusCode) { return res.status(error.statusCode).json({ success: false, message: error.message }); }
         console.error("Delete Certificate Error:", error);
         next(error);
    }
};