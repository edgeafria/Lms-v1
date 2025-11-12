const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
// No new imports needed for this fix

const { validationResult } = require('express-validator');

// @desc    Get all courses with filters
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res, next) => {
  // (No changes to this function)
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
  
  // --- 🐞 ADDED DEBUG LOGS ---
  console.log(`[DEBUG GET /:id] --- Fetching course for ID: ${req.params.id} ---`);
  
  try {
    // --- 1. POPULATE THE BASICS (WITH NESTED FIX) ---
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio skills') // Get static info
      .populate('modules.lessons') 
      .populate({ // <-- 🐞 THIS IS THE FIX
        path: 'reviews', // 1. Populate the reviews
        populate: {
          path: 'student', // 2. Inside each review, populate the student
          select: 'name avatar' // Only get the student fields we need
        }
      });

    if (!course) {
      console.log(`[DEBUG GET /:id] ❌ Error: Course not found.`);
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    
    console.log(`[DEBUG GET /:id] ✅ Step 1: Found course: "${course.title}"`);
    console.log(`[DEBUG GET /:id] ✅ Step 1: Populated instructor (static):`, course.instructor);


    // Increment views
    await Course.updateOne({ _id: req.params.id }, { $inc: { 'analytics.views': 1 } });
    
    // --- 2. CALCULATE INSTRUCTOR STATS ---
    const instructorId = course.instructor._id;
    console.log(`[DEBUG GET /:id] ⚙️ Step 2: Calculating stats for instructor ID: ${instructorId}`);
    
    // Find all published courses by this instructor
    const instructorCourses = await Course.find({ 
      instructor: instructorId, 
      status: 'published' 
    }).select('enrollmentCount rating.average'); // Only get the data we need

    console.log(`[DEBUG GET /:id] ⚙️ Step 2: Found ${instructorCourses.length} published courses for this instructor.`);

    // Calculate stats
    const totalCourses = instructorCourses.length;
    
    const totalStudents = instructorCourses.reduce(
      (sum, c) => sum + (c.enrollmentCount || 0), 0
    );
    
    const coursesWithRatings = instructorCourses.filter(c => c.rating && c.rating.average > 0);
    const totalRatingSum = coursesWithRatings.reduce(
      (sum, c) => sum + c.rating.average, 0
    );
    const averageRating = coursesWithRatings.length > 0 
      ? (totalRatingSum / coursesWithRatings.length) 
      : 0;
      
    console.log(`[DEBUG GET /:id] ⚙️ Step 2: Calculated Stats: totalStudents=${totalStudents}, totalCourses=${totalCourses}, averageRating=${averageRating}`);


    // --- 3. COMBINE THE DATA ---
    console.log(`[DEBUG GET /:id] 🧬 Step 3: Combining data...`);
    let courseObj = course.toObject();
    
    // Manually add the new stats to the instructor object
    courseObj.instructor.students = totalStudents;
    courseObj.instructor.courses = totalCourses;
    courseObj.instructor.rating = parseFloat(averageRating.toFixed(1)); // Send as a clean number

    // Re-assign the view count (since the .toObject() might be stale)
    courseObj.analytics.views = (course.analytics.views || 0) + 1;
    
    console.log(`[DEBUG GET /:id] 🧬 Step 3: Final instructor object:`, courseObj.instructor);


    // --- 4. SEND THE COMBINED OBJECT ---
    console.log(`[DEBUG GET /:id] ✅ Step 4: Sending final data to frontend.`);
    res.status(200).json({
      success: true,
      data: courseObj, // Send the modified object
    });

  } catch (error) {
    console.log(`[DEBUG GET /:id] ❌❌❌ CRITICAL ERROR:`, error);
    next(error);
  }
};
// --- END OF UPDATED FUNCTION ---

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
exports.createCourse = async (req, res, next) => {
  // --- 🐞 ADDED DEBUG LOGS ---
  console.log(`[DEBUG POST /] --- Creating new course ---`);
  console.log(`[DEBUG POST /] Received body:`, req.body);
  
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
      duration,       // <-- ADDED
      accessPeriod    // <-- ADDED
    } = req.body;

    const courseData = {
      title,
      description,
      shortDescription,
      category,
      level,
      price,
      duration,       // <-- ADDED
      accessPeriod,   // <-- ADDED
      instructor: req.user.userId, 
    };
    
    console.log(`[DEBUG POST /] Saving new course object:`, courseData);

    const course = new Course(courseData);
    const newCourse = await course.save();

    await newCourse.populate('instructor', 'name avatar'); 
    
    console.log(`[DEBUG POST /] ✅ Course created successfully.`);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse,
    });
  } catch (error) {
    console.log(`[DEBUG POST /] ❌❌❌ CRITICAL ERROR:`, error);
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Course Owner/Admin)
exports.updateCourse = async (req, res, next) => {
  
  // --- 🐞 ADDED DEBUG LOGS ---
  console.log(`[DEBUG PUT /:id] --- Updating course ID: ${req.params.id} ---`);
  console.log(`[DEBUG PUT /:id] Received body:`, req.body);
  
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      console.log(`[DEBUG PUT /:id] ❌ Error: Course not found.`);
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
      console.log(`[DEBUG PUT /:id] ❌ Error: User ${req.user.userId} not authorized.`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course',
      });
    }

    // Prevent instructor field from being updated directly
    delete req.body.instructor;
    
    console.log("[DEBUG PUT /:id] ⚙️ Step 1: Updating course with new body data...");

    let updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body, // Pass the whole body (it now includes duration and accessPeriod)
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validations
      }
    );
    
    console.log("[DEBUG PUT /:id] ⚙️ Step 2: Calling updateStats() to sync lessons...");
    await updatedCourse.updateStats();
    console.log("[DEBUG PUT /:id] ⚙️ Step 2: updateStats() finished.");

    // We fetch one last time to get the 100% correct data
    // We populate with the basic fields from the User model
    const finalCourse = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio skills') // <-- Match the populate in getCourseById
      .populate({ // <-- 🐞 THIS IS THE SECOND FIX
        path: 'reviews',
        populate: {
          path: 'student',
          select: 'name avatar'
        }
      });

    // --- REPEAT THE STATS CALCULATION LOGIC from getCourseById ---
    console.log("[DEBUG PUT /:id] ⚙️ Step 3: Recalculating instructor stats...");
    
    // 1. Get stats
    const instructorId = finalCourse.instructor._id;
    const instructorCourses = await Course.find({ 
      instructor: instructorId, 
      status: 'published' 
    }).select('enrollmentCount rating.average');
    
    const totalCourses = instructorCourses.length;
    const totalStudents = instructorCourses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
    const coursesWithRatings = instructorCourses.filter(c => c.rating && c.rating.average > 0);
    const totalRatingSum = coursesWithRatings.reduce((sum, c) => sum + c.rating.average, 0);
    const averageRating = coursesWithRatings.length > 0 ? (totalRatingSum / coursesWithRatings.length) : 0;
    
    console.log(`[DEBUG PUT /:id] ⚙️ Step 3: Calculated Stats: totalStudents=${totalStudents}, totalCourses=${totalCourses}, averageRating=${averageRating}`);

    // 2. Convert to object
    let courseObj = finalCourse.toObject();

    // 3. Add stats
    courseObj.instructor.students = totalStudents;
    courseObj.instructor.courses = totalCourses;
    courseObj.instructor.rating = parseFloat(averageRating.toFixed(1));
    
    console.log("[DEBUG PUT /:id] ✅ Step 4: Sending final data to frontend.");

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: courseObj, // Return the fully-populated object
    });
  } catch (error) {
    console.error(`[DEBUG PUT /:id] ❌❌❌ CRITICAL ERROR:`, error);
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Course Owner/Admin)
exports.deleteCourse = async (req, res, next) => {
  // (No changes to this function)
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

// --- 🐞 ADD THIS NEW FUNCTION ---

// @desc    Get all unique course categories
// @route   GET /api/courses/categories
// @access  Public
exports.getCourseCategories = async (req, res, next) => {
    try {
        // Find all distinct 'category' fields from published courses
        const categories = await Course.distinct('category', { status: 'published' });
        
        res.status(200).json({
            success: true,
            data: categories.sort(), // Send them alphabetically
        });
    } catch (error) {
        console.error("Get Categories Error:", error);
        next(error);
    }
};