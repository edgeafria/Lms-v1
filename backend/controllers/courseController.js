// [COMPLETE CODE FOR: backend/controllers/courseController.js]

const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson'); // We still need this for 'create'
const { validationResult } = require('express-validator');

// @desc    Get all courses with filters
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      level,
      minPrice,
      maxPrice,
      search,
      sort,
    } = req.query;

    let query = { status: 'published' }; // Changed from isPublished to status

    if (category) query.category = category;
    if (level) query.level = level;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    // Use text index for search
    if (search) {
      query.$text = { $search: search };
    }

    let sortOption = { createdAt: -1 };
    if (sort) {
      if (sort === 'price-low') sortOption = { price: 1 };
      if (sort === 'price-high') sortOption = { price: -1 };
      if (sort === 'newest') sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar') 
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        limit: limitNum,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio skills') 
      .populate('modules.lessons') 
      .populate('reviews'); 

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Increment views (Handle potential race conditions in production)
    // We should not save here, as it triggers pre-save hooks. Use a separate update.
    await Course.updateOne({ _id: req.params.id }, { $inc: { 'analytics.views': 1 } });
    
    // We fetch again or modify in-memory object if we need to return the view count,
    // but for this function's purpose, the fetched course is fine.
    // To be safe, let's re-assign the view count if it's returned.
    course.analytics.views = (course.analytics.views || 0) + 1;


    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
exports.createCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    
    const {
      title,
      description,
      shortDescription,
      category,
      level,
      price,
    } = req.body;

    const courseData = {
      title,
      description,
      shortDescription,
      category,
      level,
      price,
      instructor: req.user.userId, 
    };

    const course = new Course(courseData);
    const newCourse = await course.save();

    await newCourse.populate('instructor', 'name avatar'); 

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Course Owner/Admin)
exports.updateCourse = async (req, res, next) => {
  
  // --- THIS IS THE NEW LOG TO LOOK FOR ---
  console.log("--- ✅ v5 (THE REAL FIX) UPDATE COURSE FUNCTION IS RUNNING ---");

  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    
    // Check if user is the course owner or an admin
    if (
      course.instructor.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course',
      });
    }

    // Prevent instructor field from being updated directly
    delete req.body.instructor;
    
    // --- THIS IS THE FIX ---
    // We are NO LONGER calculating totalLessons here.
    // We are letting findByIdAndUpdate run, and then calling
    // your model's own updateStats method.
    
    console.log("[DEBUG] Updating course with data from frontend...");

    let updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body, // Pass the whole body (it might have stale data, that's fine)
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validations
      }
    );

    // --- NOW, WE CALL YOUR DATABASE-DRIVEN FUNCTION ---
    // This runs your `updateStats` method from Course.js,
    // which gets the TRUE count from the Lesson collection
    // and re-saves the course.
    
    console.log("[DEBUG] Update complete. Now calling updateStats() to sync database counts...");
    await updatedCourse.updateStats();
    console.log("[DEBUG] updateStats() finished.");

    // We fetch one last time to get the 100% correct data
    const finalCourse = await Course.findById(req.params.id)
                                    .populate('instructor', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: finalCourse,
    });
  } catch (error) {
    console.error("--- ⛔️ UPDATE COURSE FAILED ---", error);
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Course Owner/Admin)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if user is the course owner or an admin
    if (
      course.instructor.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course',
      });
    }

    // We must delete all associated lessons FIRST
    await Lesson.deleteMany({ course: req.params.id });
    
    // We should also delete reviews, enrollments, etc.
    // (Skipping for now as it's not related to the bug)

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};