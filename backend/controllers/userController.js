const User = require('../models/User'); // Imports the model
const Course = require('../models/Course'); 
const Enrollment = require('../models/Enrollment'); // 🐞 --- IMPORT ENROLLMENT ---
const mongoose = require('mongoose'); 
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  // ... (no change)
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
  // ... (no change)
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
  // ... (no change)
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
  // ... (no change)
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

// 🐞 --- NEW FUNCTION FOR STATS --- 🐞
// @desc    Get user stats (Admin)
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await User.aggregate([
      {
        $facet: {
          totalUsers: [
            { $count: 'count' }
          ],
          totalStudents: [
            { $match: { role: 'student' } },
            { $count: 'count' }
          ],
          totalInstructors: [
            { $match: { role: 'instructor' } },
            { $count: 'count' }
          ],
          newSignups: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $count: 'count' }
          ]
        }
      },
      {
        $project: {
          totalUsers: { $arrayElemAt: ['$totalUsers.count', 0] },
          totalStudents: { $arrayElemAt: ['$totalStudents.count', 0] },
          totalInstructors: { $arrayElemAt: ['$totalInstructors.count', 0] },
          newSignups: { $arrayElemAt: ['$newSignups.count', 0] }
        }
      }
    ]);

    // Aggregation returns an array, even for one result
    const finalStats = stats[0] || {
      totalUsers: 0,
      totalStudents: 0,
      totalInstructors: 0,
      newSignups: 0
    };

    res.status(200).json({
      success: true,
      data: finalStats
    });

  } catch (error) {
    next(error);
  }
};

// 🐞 --- UPDATED getAll TO INCLUDE ENROLLMENT COUNT --- 🐞
// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search, status } = req.query; // Added status
    let matchQuery = {};

    if (role) { matchQuery.role = role; }
    if (search) { 
      matchQuery.$or = [ 
        { name: { $regex: search, $options: 'i' } }, 
        { email: { $regex: search, $options: 'i' } } 
      ]; 
    }
    if (status === 'active') {
      matchQuery.isActive = true;
    } else if (status === 'deactivated') {
      matchQuery.isActive = false;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Use aggregation to get enrollment counts
    const usersPromise = User.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'enrollments', // The name of the enrollments collection
          localField: '_id',
          foreignField: 'student',
          as: 'enrollments'
        }
      },
      {
        $project: {
          // Select all original fields
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          avatar: 1,
          isActive: 1,
          createdAt: 1,
          // Add the new computed field
          enrollmentCount: { $size: '$enrollments' }
        }
      }
    ]);

    const totalPromise = User.countDocuments(matchQuery);

    const [users, total] = await Promise.all([usersPromise, totalPromise]);

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
  // ... (no change)
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

// 🐞 --- ADDED CREATE USER FUNCTION --- 🐞
// @desc    Create a new user (Admin)
// @route   POST /api/users
// @access  Private/Admin
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    
    const { name, email, password, role, isActive } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    user = new User({
      name,
      email,
      password,
      role,
      isActive: isActive !== undefined ? isActive : true,
      isVerified: true // Admins create verified users by default
    });

    await user.save();
    
    // Don't send password back
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: 'User created successfully', data: userResponse });
  } catch (error) {
    next(error);
  }
};


// @desc    Update user by ID (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.update = async (req, res, next) => {
  // ... (no change)
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(req.params.id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // 🐞 --- SAFETY CHECKS --- 🐞
    // 1. Prevent deleting the *only* admin account
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' }, { session });
      if (adminCount <= 1) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Cannot delete the only admin account.' });
      }
    }
    
    // 2. Handle instructor's courses
    if (user.role === 'instructor') {
      const courses = await Course.find({ instructor: user._id }).session(session);
      if (courses.length > 0) {
        // Option 1: Block deletion
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Cannot delete instructor. They are assigned to ${courses.length} course(s). Please reassign courses first.` });
        
        // Option 2: Reassign courses (e.g., to the admin performing the action)
        // await Course.updateMany({ instructor: user._id }, { $set: { instructor: req.user.userId } }, { session });
      }
    }
    
    // 3. Delete user's enrollments and submissions
    await Enrollment.deleteMany({ student: user._id }, { session });
    // Add other cleanup logic here (reviews, submissions, etc.)
    
    // Finally, delete the user
    await user.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ===============================================
// ===         PUBLIC CONTROLLERS              ===
// ===============================================

// @desc    Get all active instructors (Public)
// @route   GET /api/users/instructors
// @access  Public
exports.getInstructors = async (req, res, next) => {
  // ... (no change)
  console.log(`--- 🐞 [API] /v1/users/instructors endpoint hit (Page: ${req.query.page || 1}) ---`); 
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 9;
    const skip = (page - 1) * limit;

    // This is the common pipeline for matching instructors and their courses
    const aggregationPipeline = [
      // 1. Find all users who are instructors and are active
      { $match: { role: 'instructor', isActive: true } },
      
      // 2. Look up their published courses
      {
        $lookup: {
          from: 'courses', // This MUST be the collection name
          localField: '_id',
          foreignField: 'instructor',
          pipeline: [
            { $match: { status: 'published' } },
            { 
              $project: { 
                _id: 1, 
                title: 1, 
                isFeatured: { $ifNull: ["$isFeatured", false] }, 
                isNew: { $ifNull: ["$isNew", false] }, 
                enrollmentCount: { $ifNull: ["$enrollmentCount", 0] }, // Ensure enrollmentCount is a number
                'rating.average': { $ifNull: ["$rating.average", 0] } // Ensure rating is a number
              } 
            }
          ], 
          as: 'courses'
        }
      },
      
      // 3. Filter out instructors who have 0 published courses
      { $match: { 'courses.0': { $exists: true } } }, 
      
      // 4. Project the final shape
      {
        $project: {
          id: '$_id', // Use 'id' for the frontend if needed
          _id: 0, // Exclude the original _id
          name: 1,
          avatar: { $ifNull: ['$avatar.url', null] }, // Handle missing avatars
          bio: 1,
          courses: 1, 
          coursesCount: { $size: '$courses' },
          studentsCount: { $sum: '$courses.enrollmentCount' },
          rating: { $avg: '$courses.rating.average' } 
        }
      }
    ];

    // --- 🐞 REFACTORED QUERY ---
    // We run two separate queries. This is more stable than $facet.
    
    // 1. Get the paginated data
    const instructors = await User.aggregate([
      ...aggregationPipeline,
      { $skip: skip },
      { $limit: limit }
    ]);

    // 2. Get the *total count* by running the pipeline again without pagination
    const totalCountResult = await User.aggregate([
      ...aggregationPipeline,
      { $count: 'total' }
    ]);

    const totalCount = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`[API] Found ${instructors.length} instructors for page ${page}. Total: ${totalCount}`);

    // Fix null ratings (avg on empty set is null)
    instructors.forEach(inst => {
        inst.rating = inst.rating === null ? 0 : inst.rating;
        // studentsCount is handled by $sum and $ifNull, so it should be fine
    });

    // --- Send Response ---
    res.status(200).json({ 
      success: true, 
      data: instructors,
      pagination: {
        total: totalCount,
        page: page,
        totalPages: totalPages,
        limit: limit,
        hasNext: page < totalPages
      }
    });

  } catch (error) {
    console.error("--- 🐞 [API] Get Instructors Error ---", error); 
    next(error); // This will send a 500 error to the errorHandler
  }
};