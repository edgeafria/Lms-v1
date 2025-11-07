// [COMPLETE CODE FOR: backend/routes/courses.js]

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Course = require('../models/Course'); // Make sure this path is correct
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');
const mongoose = require('mongoose'); // Import mongoose

// --- ADD THIS LOG ---
console.log("[Debug Routes Init] Type of Course variable:", typeof Course);
console.log("[Debug Routes Init] Course variable content:", Course);
// --- END LOG ---

const router = express.Router();

// Utility to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
        });
    }
    next();
};

// @route   GET /api/courses
// @desc    Get all courses (Public) OR Get all courses for an Instructor
// @access  Public (or Private if instructorId is provided)
router.get('/',
    [ // Validation array
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('category').optional().isString(),
        query('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
        query('minPrice').optional().isFloat({ min: 0 }),
        query('maxPrice').optional().isFloat({ min: 0 }),
        query('rating').optional().isFloat({ min: 0, max: 5 }),
        query('search').optional().isString(),
        query('sort').optional().isIn(['newest', 'oldest', 'price-low', 'price-high', 'rating', 'popular']),
        query('instructorId').optional().isMongoId().withMessage('Invalid Instructor ID')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const {
                page = 1, limit = 12, category, level, minPrice, maxPrice,
                rating, search, sort = 'newest', featured, status, instructorId
            } = req.query;

            let filter = {};

            if (instructorId) {
                // If instructorId is provided, we MUST be authenticated.
                // We run the 'auth' middleware logic first.
                return auth(req, res, async () => {
                    // This block runs *after* auth middleware succeeds
                    try {
                        // Security Check: req.user is available
                        if (!req.user || (req.user.userId.toString() !== instructorId && req.user.role !== 'admin')) {
                            return res.status(403).json({ success: false, message: 'Not authorized to view these courses' });
                        }
                        filter.instructor = instructorId;
                        if (status) filter.status = status; // Allow instructor to filter by draft/published

                        // --- Duplicated query logic (for instructor) ---
                        let sortObj = {};
                        switch (sort) {
                            case 'newest': sortObj = { createdAt: -1 }; break;
                            case 'oldest': sortObj = { createdAt: 1 }; break;
                            default: sortObj = { createdAt: -1 };
                        }
                        const skip = (parseInt(page) - 1) * parseInt(limit);
                        const courses = await Course.find(filter)
                            .populate('instructor', 'name avatar bio')
                            .populate('coInstructors', 'name avatar')
                            // Populate lessons within modules for instructor dashboard list view
                            .populate({
                                path: 'modules.lessons',
                                model: 'Lesson',
                                select: '_id title type order isPreview' // Select minimal fields needed
                            })
                            .sort(sortObj)
                            .skip(skip)
                            .limit(parseInt(limit))
                            .lean(); // Use lean for performance if not modifying

                        const total = await Course.countDocuments(filter);
                        const totalPages = Math.ceil(total / parseInt(limit));
                        res.json({ success: true, data: courses, pagination: { currentPage: parseInt(page), totalPages, totalCourses: total, hasNext: parseInt(page) < totalPages, hasPrev: parseInt(page) > 1 } });
                        // --- End Duplicated Logic ---
                    } catch (error) {
                         console.error('Get instructor courses error:', error);
                        next(error);
                    }
                });
            }

            // --- Public Logic (no instructorId) ---
            // No auth is required here
            filter.status = status || 'published'; // Default to published

            if (category) filter.category = category;
            if (level) filter.level = level;
            if (featured) filter.featured = featured === 'true';
            if (minPrice || maxPrice) { filter.price = {}; if (minPrice) filter.price.$gte = parseFloat(minPrice); if (maxPrice) filter.price.$lte = parseFloat(maxPrice); }
            if (rating) filter['rating.average'] = { $gte: parseFloat(rating) };
            if (search) filter.$text = { $search: search };

            let sortObj = {};
            switch (sort) {
                case 'newest': sortObj = { createdAt: -1 }; break;
                case 'oldest': sortObj = { createdAt: 1 }; break;
                case 'price-low': sortObj = { price: 1 }; break;
                case 'price-high': sortObj = { price: -1 }; break;
                case 'rating': sortObj = { 'rating.average': -1 }; break;
                case 'popular': sortObj = { enrollmentCount: -1 }; break; // Assuming enrollmentCount exists
                default: sortObj = { createdAt: -1 };
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const courses = await Course.find(filter)
                .populate('instructor', 'name avatar bio') // Populate instructor details
                .populate('coInstructors', 'name avatar')
                .select('-modules.lessons') // Exclude detailed lessons list for public view
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(); // Use lean for performance

            const total = await Course.countDocuments(filter);
            const totalPages = Math.ceil(total / parseInt(limit));
            res.json({ success: true, data: courses, pagination: { currentPage: parseInt(page), totalPages, totalCourses: total, hasNext: parseInt(page) < totalPages, hasPrev: parseInt(page) > 1 } });
        } catch (error) {
            console.error('Get public courses error:', error);
            next(error);
        }
    }
);

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        console.log(`[Debug GET /:id] Attempting to fetch course with ID: ${req.params.id}`); // Log entry

        // Validate ID format early
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log(`[Debug GET /:id] Invalid ID format: ${req.params.id}`);
            return res.status(400).json({ success: false, message: 'Invalid course ID format' });
        }

         // Check if Course is actually the Mongoose model right before using it
         if (typeof Course.findById !== 'function') {
            console.error("[Debug GET /:id] CRITICAL ERROR: Course.findById is not a function. Course variable:", Course);
            throw new Error("Internal Server Configuration Error: Course model not loaded correctly."); // Throw a generic error
        }

        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name avatar bio socialLinks')
            .populate('coInstructors', 'name avatar bio')
            .populate({
                path: 'modules.lessons',
                model: 'Lesson',
                // Keep the select, but ensure all fields exist in the Lesson model
                select: 'title type duration isPreview order description content _id' // Explicitly add _id
            })
            .populate({
                path: 'reviews',
                populate: { path: 'student', select: 'name avatar' },
                options: { limit: 10, sort: { createdAt: -1 } }
            });

        if (!course) {
            console.log(`[Debug GET /:id] Course not found: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        console.log(`[Debug GET /:id] Course found. Incrementing views.`);
        // Increment view count
        if (!course.analytics) { course.analytics = { views: 0 }; }
        course.analytics.views = (course.analytics.views || 0) + 1;
        // Fire and forget save for analytics
        course.save().catch(err => console.error("[Debug GET /:id] Failed to update view count:", err));


        console.log(`[Debug GET /:id] Successfully fetched and populated course. Sending response.`);
        res.json({ success: true, data: course });

    } catch (error) {
        console.error(`[Debug GET /:id] Error during fetch/population for ID ${req.params.id}:`, error); // Log the full error
        // Don't check for CastError here, as findById should handle it before populate
        next(error); // Pass to generic error handler
    }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Instructor/Admin)
router.post('/',
    auth,
    authorize(['instructor', 'admin']),
    [ // Validation rules
        body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
        body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
        body('category').notEmpty().withMessage('Category is required'),
        body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number or zero')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        const session = await mongoose.startSession(); // Start a transaction
        session.startTransaction();
        try {
             // Check if Course is the model right before using it
            if (!(Course.prototype instanceof mongoose.Model)) {
                console.error("[Debug POST /] CRITICAL ERROR: Course is not a Mongoose Model:", Course);
                throw new Error("Internal Server Configuration Error: Course model not loaded correctly.");
            }
             // Check Lesson model too
            if (!(Lesson.prototype instanceof mongoose.Model)) {
                console.error("[Debug POST /] CRITICAL ERROR: Lesson is not a Mongoose Model:", Lesson);
                throw new Error("Internal Server Configuration Error: Lesson model not loaded correctly.");
            }


            const { modules: modulesData, ...basicInfo } = req.body;

            const course = new Course({
                ...basicInfo,
                instructor: req.user.userId,
                modules: [] // Modules will be added later
            });

            // We'll save the course at the end, inside the transaction
            const savedModules = [];
            const allNewLessons = [];

            if (modulesData && Array.isArray(modulesData)) {
                for (const mod of modulesData) {
                    const newModuleId = new mongoose.Types.ObjectId(); // Generate module ID *first*
                    const savedLessonIds = [];

                    if (mod.lessons && Array.isArray(mod.lessons)) {
                        for (const les of mod.lessons) {
                            // Validate lesson data (basic example)
                            if (!les.title || !les.type || les.order === undefined) {
                                throw new Error('Lesson validation failed: Missing title, type, or order.');
                            }
                            // Create Lesson documents (in memory)
                            const newLesson = new Lesson({
                                ...les,
                                _id: new mongoose.Types.ObjectId(), // Generate new lesson ID
                                course: course._id, // Link to the course being created
                                module: newModuleId, // <-- Use the generated module ID
                                instructor: req.user.userId // Add instructor to lesson
                            });
                            allNewLessons.push(newLesson); // Add to list to be saved
                            savedLessonIds.push(newLesson._id); // Collect the new ID
                        }
                    }

                    savedModules.push({
                        _id: newModuleId,
                        title: mod.title,
                        description: mod.description,
                        order: mod.order,
                        lessons: savedLessonIds // Array of lesson ObjectIds
                    });
                }
            }

            if (allNewLessons.length > 0) {
                await Lesson.insertMany(allNewLessons, { session });
            }
            course.modules = savedModules; // Assign the processed modules
            
            // --- THIS IS THE FIX FOR CREATE ---
            // Get the TRUE count of all lessons for this course from the database
            const totalLessons = allNewLessons.length; // Since it's a new course, this is the total
            
            // Force the course object to use this new count
            course.totalLessons = totalLessons;
            
            console.log(`--- ✅ REAL FIX APPLIED (CREATE) ---`);
            console.log(`[DEBUG] Set total lessons to: ${totalLessons}.`);
            // --- END FIX ---
            
            await course.save({ session }); // Save the course with module refs
            await session.commitTransaction();
            session.endSession();

            // Populate necessary fields for the response AFTER commit
            const createdCourse = await Course.findById(course._id)
                .populate('instructor', 'name avatar bio')
                .populate({
                    path: 'modules.lessons',
                    model: 'Lesson'
                });

            res.status(201).json({ success: true, message: 'Course created successfully', data: createdCourse });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Create course error:', error);
             // Handle potential duplicate slug error (if using unique slug)
            if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
                 return res.status(400).json({ success: false, message: 'A course with this title already exists. Please choose a different title.' });
            }
            // Pass Mongoose validation errors nicely
            if (error.name === 'ValidationError') {
                 return res.status(400).json({ success: false, message: error.message, errors: error.errors });
            }
            next(error); // Pass other errors to the generic handler
        }
    });


// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Course Instructor/Admin)
router.put('/:id',
    auth,
    authorize(['instructor', 'admin']),
    [ // Validation rules (less strict on update)
        body('title').optional().trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
        body('description').optional().trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
        body('category').optional().notEmpty().withMessage('Category cannot be empty'),
        body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number or zero')
        // Add more optional validations as needed
    ],
    handleValidationErrors,
    async (req, res, next) => {
        
        // --- THIS IS THE NEW LOG TO LOOK FOR ---
        console.log("--- ✅ v10 (FINAL SYNC FIX) UPDATE COURSE FUNCTION IS RUNNING ---");

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const { modules: modulesData, ...basicInfo } = req.body;

            // Validate ID format early
            if (!mongoose.Types.ObjectId.isValid(id)) {
                 await session.abortTransaction(); session.endSession();
                 return res.status(400).json({ success: false, message: 'Invalid course ID format' });
            }

             // Check if Course is the model right before using it
            if (typeof Course.findById !== 'function') {
                console.error("[Debug PUT /:id] CRITICAL ERROR: Course.findById is not a function. Course variable:", Course);
                throw new Error("Internal Server Configuration Error: Course model not loaded correctly.");
            }
             // Check Lesson model too
             if (typeof Lesson.bulkWrite !== 'function' || typeof Lesson.insertMany !== 'function' || typeof Lesson.deleteMany !== 'function') {
                 console.error("[Debug PUT /:id] CRITICAL ERROR: Lesson model methods missing:", Lesson);
                 throw new Error("Internal Server Configuration Error: Lesson model not loaded correctly.");
             }


            const course = await Course.findById(id).session(session);
            if (!course) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
            // Authorization check
            if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                await session.abortTransaction();
                session.endSession();
                return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
            }

            // 1. Update basic course info
            course.set(basicInfo);

            // 2. Process Modules and Lessons
            const newOrUpdatedModules = [];
            const allLessonIdsInReq = new Set();
            const lessonsToCreate = [];
            const lessonUpdateOps = []; // Store bulk write operations

            if (modulesData && Array.isArray(modulesData)) {
                for (const [modIndex, modData] of modulesData.entries()) {
                    const lessonIdsForThisModule = [];
                    // Use existing _id or generate a new one if it's a new module
                    const moduleId = (modData._id && !modData._id.startsWith('temp_') && mongoose.Types.ObjectId.isValid(modData._id))
                                     ? modData._id
                                     : new mongoose.Types.ObjectId();

                    if (modData.lessons && Array.isArray(modData.lessons)) {
                        for (const [lesIndex, lesData] of modData.lessons.entries()) {
                             // Basic validation
                             if (!lesData.title || !lesData.type) {
                                throw new Error(`Lesson validation failed: Missing title or type for lesson at module index ${modIndex}, lesson index ${lesIndex}.`);
                            }
                             // Validate lesson ID format if present
                             if (lesData._id && !lesData._id.startsWith('temp_') && !mongoose.Types.ObjectId.isValid(lesData._id)) {
                                throw new Error(`Invalid Lesson ID format for lesson at module index ${modIndex}, lesson index ${lesIndex}.`);
                            }


                            if (lesData._id && !lesData._id.startsWith('temp_') /*&& mongoose.Types.ObjectId.isValid(lesData._id) - validated above*/) {
                                // Existing Lesson: Prepare update operation
                                const lessonIdStr = lesData._id.toString();
                                allLessonIdsInReq.add(lessonIdStr);
                                lessonUpdateOps.push({
                                    updateOne: {
                                        filter: { _id: lesData._id, course: id }, // Ensure it belongs to this course
                                        update: {
                                            $set: {
                                                title: lesData.title,
                                                type: lesData.type,
                                                content: lesData.content, // Make sure content structure matches Lesson schema
                                                duration: lesData.duration || 0,
                                                order: lesData.order ?? lesIndex, // Use provided order or index
                                                isPreview: lesData.isPreview || false,
                                                module: moduleId // Update module link
                                            }
                                        }
                                    }
                                });
                                lessonIdsForThisModule.push(lesData._id);
                            } else {
                                // New Lesson: Prepare creation
                                const newLesson = {
                                    ...lesData, // Spread incoming data
                                    _id: new mongoose.Types.ObjectId(), // Generate new ID
                                    course: id,
                                    module: moduleId, // Link to the correct module
                                    instructor: req.user.userId,
                                    order: lesData.order ?? lesIndex // Use provided order or index
                                };
                                lessonsToCreate.push(newLesson);
                                lessonIdsForThisModule.push(newLesson._id);
                                allLessonIdsInReq.add(newLesson._id.toString());
                            }
                        }
                    }

                    newOrUpdatedModules.push({
                        _id: moduleId, // Use the determined/generated module ID
                        title: modData.title,
                        description: modData.description,
                        order: modData.order ?? modIndex, // Use provided order or index
                        lessons: lessonIdsForThisModule
                    });
                }
            }

            // 3. Identify and Delete Lessons Removed in the Frontend
            const existingLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.toString()));
            const lessonsToDelete = existingLessonIds.filter(id => !allLessonIdsInReq.has(id));
            if (lessonsToDelete.length > 0) {
                 console.log("[Debug Save] Deleting lessons:", lessonsToDelete);
                await Lesson.deleteMany({ _id: { $in: lessonsToDelete }, course: id }, { session });
                
                // --- THIS IS THE FIX FOR "7/6" ---
                // After deleting lessons, pull them from all enrollments for this course
                await Enrollment.updateMany(
                    { course: id },
                    { $pull: { "progress.completedLessons": { lesson: { $in: lessonsToDelete } } } },
                    { session }
                );
                console.log(`[DEBUG] Synced enrollments: Removed ${lessonsToDelete.length} lesson(s) from all enrollments.`);
                // --- END FIX ---
            }

            // 4. Create New Lessons
            if (lessonsToCreate.length > 0) {
                 console.log("[Debug Save] Creating lessons:", lessonsToCreate.length);
                await Lesson.insertMany(lessonsToCreate, { session });
            }

            // 5. Execute Bulk Updates for Existing Lessons
            if (lessonUpdateOps.length > 0) {
                 console.log("[Debug Save] Updating lessons:", lessonUpdateOps.length);
                await Lesson.bulkWrite(lessonUpdateOps, { session });
            }

            // 6. Update Course with the new module structure AND RECALCULATE STATS
            course.modules = newOrUpdatedModules;
            
            // --- THIS IS THE FIX FOR "0/6" vs "0/7" ---
            // Get the TRUE count of all lessons for this course from the database
            const totalLessons = await Lesson.countDocuments({ course: id }, { session });
            
            // Force the course object to use this new count
            course.totalLessons = totalLessons;
            
            console.log(`--- ✅ REAL FIX APPLIED (UPDATE) ---`);
            console.log(`[DEBUG] Recalculated total lessons: ${totalLessons}. Forcing this value into the update.`);
            // --- END FIX ---
            
            await course.save({ session }); // Now it saves the correct count

            // 7. Commit Transaction
            await session.commitTransaction();
            
            // --- NEW FIX: Update all enrollments AFTER transaction ---
            // We do this outside the transaction so it doesn't slow down the save.
            // It will run in the background.
            (async () => {
                try {
                    console.log(`[ASYNC SYNC] Starting sync for ${totalLessons} lessons on course ${id}`);
                    const enrollments = await Enrollment.find({ course: id }).select('_id progress status');
                    
                    // This is the full, correct list of all lesson IDs that *actually* exist for this course
                    const allLessonIdsInDb = (await Lesson.find({ course: id }).select('_id')).map(l => l._id.toString());
                    const allLessonIdsSet = new Set(allLessonIdsInDb);

                    for (const enr of enrollments) {
                        const originalCompleted = enr.progress.completedLessons.map(l => l.lesson.toString());
                        
                        // Filter the student's completed list against the course's *actual* lesson list
                        const newCompletedLessonObjects = originalCompleted
                            .filter(id => allLessonIdsSet.has(id)) // Filter against DB lessons
                            .map(lessonId => ({ lesson: lessonId })); // Re-form the object structure

                        const completedCount = newCompletedLessonObjects.length;
                        
                        const newPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
                        
                        // Cap at 100
                        const finalPercentage = Math.min(100, newPercentage);

                        // Update status
                        let newStatus = enr.status;
                        let completedAtUpdate = enr.completedAt; // Keep existing date by default

                        if (finalPercentage >= 100 && enr.status !== 'completed') {
                            newStatus = 'completed';
                            completedAtUpdate = new Date(); // Set new completion date
                        } else if (finalPercentage < 100 && enr.status === 'completed') {
                            // This is the fix: if they were 100% but now aren't, set them back to active
                            newStatus = 'active';
                            completedAtUpdate = undefined; // Clear completion date
                        }
                        
                        // Update the single enrollment document
                        await Enrollment.updateOne(
                            { _id: enr._id },
                            { 
                                $set: { 
                                    'progress.percentageComplete': finalPercentage, // This is the corrected variable
                                    'status': newStatus,
                                    'progress.completedLessons': newCompletedLessonObjects, // Save the cleaned array
                                    'completedAt': completedAtUpdate // Set or unset the completion date
                                } 
                            }
                        );
                    }
                    console.log(`[ASYNC SYNC] Finished syncing ${enrollments.length} enrollments.`);
                } catch (err) {
                    console.error(`[ASYNC SYNC ERROR] Failed to sync enrollments:`, err);
                }
            })();
            // --- END NEW FIX ---
            
            session.endSession();

            // 8. Fetch the fully populated course for the response
            const finalUpdatedCourse = await Course.findById(id)
                .populate('instructor', 'name avatar bio')
                .populate({
                    path: 'modules.lessons',
                    model: 'Lesson'
                });


            if (!finalUpdatedCourse) {
                 console.error(`[Error Update] Failed to retrieve updated course after save for ID: ${id}`);
                 return res.status(404).json({ success: false, message: 'Updated course could not be retrieved' });
            }

            res.json({ success: true, message: 'Course updated successfully', data: finalUpdatedCourse });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Update course error:', error);
             // Handle potential duplicate slug error (if using unique slug and title changed)
            if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
                 return res.status(400).json({ success: false, message: 'A course with this title already exists. Please choose a different title.' });
            }
             // Pass Mongoose validation errors nicely
            if (error.name === 'ValidationError') {
                 // Log specific validation errors
                 console.error('Mongoose Validation Error details:', error.errors);
                 return res.status(400).json({ success: false, message: `Validation Failed: ${error.message}`, errors: error.errors });
            }
            next(error); // Pass other errors
        }
    });

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Course Instructor/Admin)
router.delete('/:id',
    auth,
    authorize(['instructor', 'admin']),
    async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
             // Validate ID format early
             if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  await session.abortTransaction(); session.endSession();
                  return res.status(400).json({ success: false, message: 'Invalid course ID format' });
             }

            const course = await Course.findById(req.params.id).session(session);
            if (!course) {
                 await session.abortTransaction(); session.endSession();
                 return res.status(404).json({ success: false, message: 'Course not found' });
            }
            if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                 await session.abortTransaction(); session.endSession();
                 return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
            }
            // Check for enrollments before deleting
            const enrollmentCount = await Enrollment.countDocuments({ course: req.params.id }).session(session);
            if (enrollmentCount > 0) {
                 await session.abortTransaction(); session.endSession();
                 return res.status(400).json({ success: false, message: `Cannot delete course with ${enrollmentCount} active enrollments. Archive it instead?` });
            }

            // Delete associated data
            await Lesson.deleteMany({ course: req.params.id }, { session });
            await Review.deleteMany({ course: req.params.id }, { session });
            
            // --- THIS IS THE NEW FIX ---
            // Also delete all enrollments for this course
            await Enrollment.deleteMany({ course: req.params.id }, { session });
            console.log(`[Debug Delete] Deleted all enrollments for course ${req.params.id}`);
            // --- END FIX ---

            // Delete the course itself
            await Course.findByIdAndDelete(req.params.id, { session });

            await session.commitTransaction();
            session.endSession();

            res.json({ success: true, message: 'Course and associated content deleted successfully' });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Delete course error:', error);
            next(error);
        }
    });

// @route   POST /api/courses/:id/publish
// @desc    Publish or Unpublish course
// @access  Private (Course Instructor/Admin)
router.post('/:id/publish',
    auth,
    authorize(['instructor', 'admin']),
    async (req, res, next) => {
        try {
             // Validate ID format early
             if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  return res.status(400).json({ success: false, message: 'Invalid course ID format' });
             }

            const course = await Course.findById(req.params.id);
            if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
            if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                 return res.status(403).json({ success: false, message: 'Not authorized to publish this course' });
            }

            // Determine the target status: if currently published, unpublish (to draft), otherwise publish.
            const isCurrentlyPublished = course.status === 'published';
            const targetStatus = isCurrentlyPublished ? 'draft' : 'published'; // Toggle logic

            if (targetStatus === 'published') {
                 // Check prerequisites for publishing
                if (!course.thumbnail?.url || !course.description || course.modules.length === 0 || !course.modules.some(m => m.lessons && m.lessons.length > 0)) {
                    return res.status(400).json({ success: false, message: 'Course must have a thumbnail, description, and at least one lesson in one module to be published.' });
                }
                course.status = 'published';
                course.publishedAt = new Date();
            } else { // Unpublishing (setting to draft)
                course.status = 'draft';
                course.publishedAt = undefined; // Clear published date
            }

            await course.save();
            res.json({ success: true, message: `Course status updated to ${targetStatus} successfully`, data: course }); // Return the updated course
        } catch (error) {
            console.error('Publish/Unpublish course error:', error);
            next(error);
        }
    });

// @route   GET /api/courses/:id/students
// @desc    Get course students (enrollments)
// @access  Private (Course Instructor/Admin)
router.get('/:id/students',
    auth,
    authorize(['instructor', 'admin']),
    async (req, res, next) => {
        try {
             // Validate ID format first
             if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  return res.status(400).json({ success: false, message: 'Invalid course ID format' });
             }

            // Check if course exists and user is authorized (optional, depends on security needs)
            const course = await Course.findById(req.params.id, 'instructor'); // Fetch only instructor field
            if (!course) {
                // --- THIS IS THE LINE I FIXED (It had garbage text) ---
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
             if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                 return res.status(403).json({ success: false, message: 'Not authorized to view students for this course' });
            }


            const enrollments = await Enrollment.find({ course: req.params.id })
                .populate('student', 'name email avatar lastLogin') // Added lastLogin
                .sort({ enrolledAt: -1 }) // Sort by enrollment date descending
                .lean(); // Use lean if you don't need Mongoose documents

            res.json({ success: true, data: enrollments });
        } catch (error) {
            console.error('Get course students error:', error);
            next(error);
        }
    });

// @route   PUT /api/courses/:id/thumbnail  (Changed from POST for semantic update)
// @desc    Upload/Update course thumbnail
// @access  Private (Course Instructor/Admin)
router.put('/:id/thumbnail', // Changed route to PUT and path
    auth,
    authorize(['instructor', 'admin']),
    upload.single('thumbnail'), // Expects 'thumbnail' field in form-data
    async (req, res, next) => {
        try {
            // Validate ID format
             if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  // Optionally delete uploaded file if ID is invalid
                  return res.status(400).json({ success: false, message: 'Invalid course ID format' });
             }

            const course = await Course.findById(req.params.id);
            if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
            if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                // Should delete uploaded file if unauthorized? Depends on upload middleware setup.
                return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
            }
            if (!req.file) { return res.status(400).json({ success: false, message: 'No file uploaded. Please include a "thumbnail" file in your request.' }); }

            // TODO: Delete old thumbnail from Cloudinary using course.thumbnail.public_id if it exists

            // Update thumbnail info
            course.thumbnail = {
                public_id: req.file.filename, // Or req.file.public_id if Cloudinary provides it directly
                url: req.file.path // URL from Cloudinary
            };
            await course.save();
            res.json({ success: true, message: 'Thumbnail updated successfully', data: { thumbnail: course.thumbnail } }); // Send back only thumbnail info
        } catch (error) {
             // Handle potential errors during save or file access
            console.error('Upload thumbnail error:', error);
            next(error);
        }
    });


module.exports = router;