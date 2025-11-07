const Activity = require('../models/Activity');
const { validationResult } = require('express-validator');

// @desc    Get all activities for the logged-in user (paginated)
// @route   GET /api/activities
// @access  Private (Student)
exports.getAll = async (req, res, next) => {
    try {
        // Auth check (assuming middleware in route file)
        if (req.user.role !== 'student') {
             // Or allow admin/instructor to query by studentId
             return res.status(403).json({ success: false, message: 'Access denied for this role' });
        }

        const { page = 1, limit = 10 } = req.query; // Default to 10 recent activities
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const filter = { user: req.user.userId };

        const activities = await Activity.find(filter)
            .populate('course', 'title slug') // Populate course title and slug
            .populate('lesson', 'title')       // Populate lesson title
            .sort({ createdAt: -1 })           // Get newest first
            .skip(skip)
            .limit(limitNum);
            
        const total = await Activity.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                total
            }
        });

    } catch (error) {
        console.error('Get Activities Error:', error);
        next(error);
    }
};

// --- Placeholders for other routes if needed ---
exports.getOne = (req, res) => { res.status(405).json({ success: false, message: 'Method Not Allowed' }); };
exports.create = (req, res) => { res.status(405).json({ success: false, message: 'Activities are created by other actions, not directly' }); };
exports.update = (req, res) => { res.status(405).json({ success: false, message: 'Method Not Allowed' }); };
exports.remove = (req, res) => { res.status(405).json({ success: false, message: 'Method Not Allowed' }); };