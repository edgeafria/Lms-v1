const User = require('../models/User'); // Imports the model
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary'); // For avatar deletion

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { name, bio, skills, location, website, socialLinks } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name ?? user.name;
    user.bio = bio ?? user.bio;
    user.skills = skills ?? user.skills;
    user.location = location ?? user.location;
    user.website = website ?? user.website;
    user.socialLinks = socialLinks || user.socialLinks;

    const updatedUser = await user.save();
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Optional: Delete old avatar from Cloudinary
    if (user.avatar && user.avatar.public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      } catch (uploadError) {
        console.error('Failed to delete old avatar from Cloudinary:', uploadError);
      }
    }

    user.avatar = {
      public_id: req.file.filename, // From multer-storage-cloudinary
      url: req.file.path        // From multer-storage-cloudinary
    };
    const updatedUser = await user.save();

    res.status(200).json({ success: true, message: 'Avatar uploaded successfully', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   POST /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// ===============================================
// ===          ADMIN CONTROLLERS              ===
// ===============================================

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    let query = {};
    if (role) { query.role = role; }
    if (search) { query.$or = [ { name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } } ]; }
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).select('-password');
    const total = await User.countDocuments(query);
    res.status(200).json({
      success: true, data: users,
      pagination: { total, limit: limitNum, page: pageNum, totalPages: Math.ceil(total / limitNum), hasNext: pageNum * limitNum < total, hasPrev: pageNum > 1, }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user by ID (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.update = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.isActive = isActive !== undefined ? isActive : user.isActive;
    const updatedUser = await user.save();
    res.status(200).json({ success: true, message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user by ID (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.remove = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};