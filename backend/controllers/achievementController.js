const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @desc    Get all achievements earned by the logged-in user
// @route   GET /api/achievements
// @access  Private (Student)
exports.getAll = async (req, res, next) => {
    try {
        // Auth/Role check is handled by middleware in the route file
        const userId = req.user.userId;

        // Find the user and populate their earned achievements
        // We select only the 'earnedAchievements' field and populate it
        const user = await User.findById(userId)
            .select('earnedAchievements')
            .populate({
                path: 'earnedAchievements',
                model: 'Achievement' // Explicitly tell model name
            });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user.earnedAchievements // Return the array of populated achievements
        });

    } catch (error) {
        console.error('Get Earned Achievements Error:', error);
        next(error);
    }
};

// --- Placeholders for other routes ---
exports.getOne = (req, res) => {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
exports.create = (req, res) => {
    res.status(405).json({ success: false, message: 'Achievements are earned, not created directly' });
};
exports.update = (req, res) => {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
exports.remove = (req, res) => {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
};