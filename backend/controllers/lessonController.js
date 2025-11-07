// [COMPLETE CODE FOR: backend/controllers/lessonController.js]

const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');

// @desc    Get all lessons for a course module
// @route   GET /api/lessons?courseId=...&moduleId=...
// @access  Public (for published courses) / Private (for instructors/admins of draft courses)
exports.getAll = async (req, res, next) => {
    try {
        const { courseId, moduleId } = req.query;
        if (!courseId || !moduleId) { return res.status(400).json({ success: false, message: 'Course ID and Module ID query parameters are required' }); }

        const course = await Course.findById(courseId);
        if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }

        // --- CORRECTED ACCESS LOGIC ---
        let canAccess = false;

        // 1. Allow public access if the course is published
        if (course.status === 'published') {
            canAccess = true;
        }
        // 2. Allow instructor/admin access regardless of published status
        else if (req.user) { // Check if a user is potentially logged in (auth middleware might run or not depending on route setup)
            if (req.user.role === 'admin' || course.instructor.toString() === req.user.userId.toString()) {
                canAccess = true;
            }
        }

        if (!canAccess) {
             return res.status(403).json({ success: false, message: 'Access denied to this course\'s lessons' });
        }
        // --- END CORRECTION ---

        const lessons = await Lesson.find({ course: courseId, module: moduleId }).sort({ order: 1 });
        res.status(200).json({ success: true, count: lessons.length, data: lessons }); // Added count

    } catch (error) {
        next(error);
    }
};

// @desc    Get single lesson by ID
// @route   GET /api/lessons/:id
// @access  Private (based on course enrollment/ownership/preview status)
exports.getOne = async (req, res, next) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('course', 'instructor status');
        if (!lesson) { return res.status(404).json({ success: false, message: 'Lesson not found' }); }
        let canAccess = false;
        // Allow access if lesson is marked as preview or free
        if (lesson.isPreview || lesson.isFree) {
            canAccess = true;
        }
        // Allow access if user is logged in
        else if (req.user) {
            // Allow instructor/admin
            if (req.user.role === 'admin' || lesson.course.instructor.toString() === req.user.userId.toString()) {
                canAccess = true;
            } else { // Check student enrollment
                const Enrollment = require('../models/Enrollment');
                const enrollment = await Enrollment.findOne({ student: req.user.userId, course: lesson.course._id, status: 'active' });
                if (enrollment) { canAccess = true; }
            }
        }
        if (!canAccess) { return res.status(403).json({ success: false, message: 'Access denied to this lesson' }); }
        res.status(200).json({ success: true, data: lesson });
    } catch (error) { next(error); }
};

// @desc    Create new lesson
// @route   POST /api/lessons
// @access  Private (Instructor/Admin)
exports.create = async (req, res, next) => {
    // --- NEW DEBUG LOG ---
    console.log("--- ✅ NEW CREATE LESSON FUNCTION RUNNING ---");
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
        
        const { courseId, moduleId, title, type, order } = req.body;
        
        // --- 1. Validate Course and Module ---
        const course = await Course.findOne({ _id: courseId, "modules._id": moduleId });
        if (!course) { return res.status(404).json({ success: false, message: 'Course or Module not found' }); }
        if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') { return res.status(403).json({ success: false, message: 'Not authorized to add lessons to this course' }); }
        
        // --- 2. Create the Lesson ---
        const lessonData = { 
            ...req.body, 
            course: courseId, 
            module: moduleId, 
            order: order !== undefined ? order : (await Lesson.countDocuments({ course: courseId, module: moduleId })) + 1, 
        };
        
        const lesson = new Lesson(lessonData);
        await lesson.save();
        console.log(`[DEBUG] New lesson ${lesson._id} saved.`);
        
        // --- 3. Atomically Update the Course ---
        
        // First, get the new true total count from the Lesson collection
        const totalLessons = await Lesson.countDocuments({ course: courseId });
        console.log(`[DEBUG] New total lesson count is: ${totalLessons}`); // e.g., 7

        // Now, update the Course document in one atomic operation
        const updateResult = await Course.updateOne(
            { _id: courseId, "modules._id": moduleId },
            { 
                $push: { "modules.$.lessons": lesson._id }, // Push lesson ID into the correct module's lessons array
                $set: { totalLessons: totalLessons }        // Set the new total lesson count
            }
        );
        
        console.log(`[DEBUG] Course.updateOne result:`, updateResult);
        // --- END FIX ---

        res.status(201).json({ success: true, message: 'Lesson created successfully', data: lesson });
    } catch (error) { 
        console.error("--- ⛔️ CREATE LESSON FAILED ---", error);
        next(error); 
    }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private (Instructor/Admin)
exports.update = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
        
        let lesson = await Lesson.findById(req.params.id);
        if (!lesson) { return res.status(404).json({ success: false, message: 'Lesson not found' }); }
        
        const course = await Course.findById(lesson.course);
        if (!course) { return res.status(404).json({ success: false, message: 'Associated course not found' }); }
        if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') { return res.status(403).json({ success: false, message: 'Not authorized to update lessons in this course' }); }
        
        delete req.body.course; delete req.body.module;
        
        lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        
        if (req.body.duration !== undefined && course.updateStats) { 
            await course.updateStats(); 
        } else if (req.body.duration !== undefined) { 
            console.warn(`Course model (ID: ${course._id}) does not have updateStats method.`); 
        }
        
        res.status(200).json({ success: true, message: 'Lesson updated successfully', data: lesson });
    } catch (error) { next(error); }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private (Instructor/Admin)
exports.remove = async (req, res, next) => {
    // --- NEW DEBUG LOG ---
    console.log("--- ✅ NEW REMOVE LESSON FUNCTION RUNNING ---");

    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) { return res.status(404).json({ success: false, message: 'Lesson not found' }); }
        
        const course = await Course.findById(lesson.course);
        if (!course) { await lesson.deleteOne(); return res.status(200).json({ success: true, message: 'Lesson deleted (associated course not found)' }); }
        if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') { return res.status(403).json({ success: false, message: 'Not authorized to delete lessons from this course' }); }
        
        // --- 1. Delete the Lesson Document ---
        await lesson.deleteOne();
        console.log(`[DEBUG] Lesson ${lesson._id} deleted.`);
        
        // --- 2. Atomically Update the Course ---
        
        // First, get the new true total count from the Lesson collection
        const totalLessons = await Lesson.countDocuments({ course: course._id });
        console.log(`[DEBUG] New total lesson count is: ${totalLessons}`); // e.g., 5

        // Now, update the Course document in one atomic operation
        const updateResult = await Course.updateOne(
            { _id: course._id },
            { 
                $pull: { "modules.$[].lessons": lesson._id }, // Pull lesson ID from ANY module's lessons array
                $set: { totalLessons: totalLessons }         // Set the new total lesson count
            }
        );
        
        console.log(`[DEBUG] Course.updateOne result:`, updateResult);
        // --- END FIX ---

        res.status(200).json({ success: true, message: 'Lesson deleted successfully' });
    } catch (error) { 
        console.error("--- ⛔️ DELETE LESSON FAILED ---", error);
        next(error); 
    }
};