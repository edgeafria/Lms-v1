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
const courseController = require('../controllers/courseController'); 

console.log("[Debug Routes Init] Type of Course variable:", typeof Course);
console.log("[Debug Routes Init] Course variable content:", Course);

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
        query('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']), 
        query('minPrice').optional().isFloat({ min: 0 }),
        query('maxPrice').optional().isFloat({ min: 0 }),
        query('rating').optional().isFloat({ min: 0, max: 5 }),
        query('search').optional().isString(),
        query('sort').optional().isIn(['newest', 'oldest', 'price-low', 'price-high', 'rating', 'popular']),
        query('instructorId').optional().isMongoId().withMessage('Invalid Instructor ID'),
        // 🐞 ADDED VALIDATION FOR FEATURED
        query('featured').optional().isIn(['true', 'false']),
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
                // ... (Instructor logic) ...
                return auth(req, res, async () => {
                    try {
                        if (!req.user || (req.user.userId.toString() !== instructorId && req.user.role !== 'admin')) {
                            return res.status(403).json({ success: false, message: 'Not authorized to view these courses' });
                        }
                        filter.instructor = instructorId;
                        if (status) filter.status = status; 
                        
                        // 🐞 ADDED FEATURED FILTER FOR INSTRUCTOR
                        if (featured) filter.featured = featured === 'true';

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
                            .populate({
                                path: 'modules.lessons',
                                model: 'Lesson',
                                select: '_id title type order isPreview' 
                            })
                            // 🐞 ADDED 'featured' TO SELECT
                            .select('title thumbnail price status category level slug featured enrollmentCount rating.average')
                            .sort(sortObj)
                            .skip(skip)
                            .limit(parseInt(limit))
                            .lean(); 

                        const total = await Course.countDocuments(filter);
                        const totalPages = Math.ceil(total / parseInt(limit));
                        res.json({ success: true, data: courses, pagination: { currentPage: parseInt(page), totalPages, totalCourses: total, hasNext: parseInt(page) < totalPages, hasPrev: parseInt(page) > 1 } });
                    } catch (error) {
                         console.error('Get instructor courses error:', error);
                        next(error);
                    }
                });
            }

            // --- Public Logic (no instructorId) ---
            
            // ADMIN DASHBOARD FIX (status)
            if (status && status !== 'all') {
                filter.status = status;
            } 
            else if (!status) {
                filter.status = 'published';
            }
            // --- END OF FIX ---

            if (category) filter.category = category;
            if (level) filter.level = level;
            
            // 🐞 UPDATED FEATURED FILTER LOGIC
            if (featured === 'true') {
              filter.featured = true;
            } else if (featured === 'false') {
              filter.featured = false;
            }
            // If 'featured' is not 'true' or 'false', we don't add it to the filter
            
            if (minPrice || maxPrice) { filter.price = {}; if (minPrice) filter.price.$gte = parseFloat(minPrice); if (maxPrice) filter.price.$lte = parseFloat(maxPrice); }
            if (rating) filter['rating.average'] = { $gte: parseFloat(rating) };
            
            if (search) {
              const searchRegex = new RegExp(search, 'i');
              filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
              ];
            }

            let sortObj = {};
            switch (sort) {
                case 'newest': sortObj = { createdAt: -1 }; break;
                case 'oldest': sortObj = { createdAt: 1 }; break;
                case 'price-low': sortObj = { price: 1 }; break;
                case 'price-high': sortObj = { price: -1 }; break;
                case 'rating': sortObj = { 'rating.average': -1 }; break;
                case 'popular': sortObj = { enrollmentCount: -1 }; break; 
                default: sortObj = { createdAt: -1 };
            }

            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;

            const courses = await Course.find(filter)
                .populate('instructor', 'name avatar bio') 
                .populate('coInstructors', 'name avatar')
                .select('-modules.lessons') // This selects all fields, including 'featured' and 'slug'
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum)
                .lean(); 

            const total = await Course.countDocuments(filter);
            const totalPages = Math.ceil(total / limitNum);
            
            res.json({ 
              success: true, 
              data: courses, 
              pagination: { 
                currentPage: pageNum, 
                totalPages, 
                totalCourses: total, 
                hasNext: pageNum < totalPages, 
                hasPrev: pageNum > 1 
              } 
            });
        } catch (error) {
            console.error('Get public courses error:', error);
            next(error);
        }
    }
);

// --- CATEGORIES ROUTE (Unchanged) ---
router.get(
    '/categories',
    courseController.getCourseCategories 
);

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
    // ... (This function is unchanged)
    try {
        console.log(`[Debug GET /:id] Attempting to fetch course with ID: ${req.params.id}`); 

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log(`[Debug GET /:id] Invalid ID format: ${req.params.id}`);
            return res.status(400).json({ success: false, message: 'Invalid course ID format' });
        }

         if (typeof Course.findById !== 'function') {
            console.error("[Debug GET /:id] CRITICAL ERROR: Course.findById is not a function. Course variable:", Course);
            throw new Error("Internal Server Configuration Error: Course model not loaded correctly."); 
        }

        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name avatar bio socialLinks') 
            .populate('coInstructors', 'name avatar bio')
            .populate({
                path: 'modules.lessons',
                model: 'Lesson',
                select: 'title type duration isPreview order description content _id'
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
        
        console.log(`[Debug GET /:id] ✅ Step 1: Found course: "${course.title}"`);
        console.log(`[Debug GET /:id] ✅ Step 1: Populated instructor (static):`, course.instructor);

        if (!course.analytics) { course.analytics = { views: 0 }; }
        course.analytics.views = (course.analytics.views || 0) + 1;
        course.save().catch(err => console.error("[Debug GET /:id] Failed to update view count:", err));

        const instructorId = course.instructor._id;
        console.log(`[Debug GET /:id] ⚙️ Step 2: Calculating stats for instructor ID: ${instructorId}`);
        
        const instructorCourses = await Course.find({ 
          instructor: instructorId, 
          status: 'published' 
        }).select('enrollmentCount rating.average');
        
        console.log(`[Debug GET /:id] ⚙️ Step 2: Found ${instructorCourses.length} published courses for this instructor.`);
    
        const totalCourses = instructorCourses.length;
        const totalStudents = instructorCourses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
        const coursesWithRatings = instructorCourses.filter(c => c.rating && c.rating.average > 0);
        const totalRatingSum = coursesWithRatings.reduce((sum, c) => sum + c.rating.average, 0);
        const averageRating = coursesWithRatings.length > 0 ? (totalRatingSum / coursesWithRatings.length) : 0;
          
        console.log(`[Debug GET /:id] ⚙️ Step 2: Calculated Stats: totalStudents=${totalStudents}, totalCourses=${totalCourses}, averageRating=${averageRating}`);

        console.log(`[Debug GET /:id] 🧬 Step 3: Combining data...`);
        let courseObj = course.toObject();
        
        courseObj.instructor.students = totalStudents;
        courseObj.instructor.courses = totalCourses;
        courseObj.instructor.rating = parseFloat(averageRating.toFixed(1));

        console.log(`[Debug GET /:id] 🧬 Step 3: Final instructor object:`, courseObj.instructor);
        
        console.log(`[Debug GET /:id] ✅ Step 4: Sending final data to frontend.`);
        res.json({ success: true, data: courseObj }); 

    } catch (error) {
        console.error(`[Debug GET /:id] Error during fetch/population for ID ${req.params.id}:`, error); 
        next(error); 
    }
});


// --- (POST, PUT, DELETE routes are unchanged) ---
// ...
// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Instructor/Admin)
router.post('/',
    auth,
    authorize(['instructor', 'admin']),
    [ 
        body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
        body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
        body('category').notEmpty().withMessage('Category is required'),
        body('level').isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).withMessage('Invalid level'), 
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number or zero')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        const session = await mongoose.startSession(); 
        session.startTransaction();
        try {
            if (!(Course.prototype instanceof mongoose.Model)) {
                console.error("[Debug POST /] CRITICAL ERROR: Course is not a Mongoose Model:", Course);
                throw new Error("Internal Server Configuration Error: Course model not loaded correctly.");
            }
            if (!(Lesson.prototype instanceof mongoose.Model)) {
                console.error("[Debug POST /] CRITICAL ERROR: Lesson is not a Mongoose Model:", Lesson);
                throw new Error("Internal Server Configuration Error: Lesson model not loaded correctly.");
            }

            const { modules: modulesData, duration, accessPeriod, ...basicInfo } = req.body;

            const course = new Course({
                ...basicInfo,
                duration, 
                accessPeriod, 
                instructor: req.user.userId,
                modules: [] 
            });

            const savedModules = [];
            const allNewLessons = [];

            if (modulesData && Array.isArray(modulesData)) {
                for (const mod of modulesData) {
                    const newModuleId = new mongoose.Types.ObjectId(); 
                    const savedLessonIds = [];

                    if (mod.lessons && Array.isArray(mod.lessons)) {
                        for (const les of mod.lessons) {
                            if (!les.title || !les.type || les.order === undefined) {
                                throw new Error('Lesson validation failed: Missing title, type, or order.');
                            }
                            const newLesson = new Lesson({
                                ...les,
                                _id: new mongoose.Types.ObjectId(), 
                                course: course._id, 
                                module: newModuleId, 
                                instructor: req.user.userId 
                            });
                            allNewLessons.push(newLesson); 
                            savedLessonIds.push(newLesson._id); 
                        }
                    }

                    savedModules.push({
                        _id: newModuleId,
                        title: mod.title,
                        description: mod.description,
                        order: mod.order,
                        lessons: savedLessonIds 
                    });
                }
            }

            if (allNewLessons.length > 0) {
                await Lesson.insertMany(allNewLessons, { session });
            }
            course.modules = savedModules; 
            
            const totalLessons = allNewLessons.length; 
            course.totalLessons = totalLessons;
            
            console.log(`--- ✅ REAL FIX APPLIED (CREATE) ---`);
            console.log(`[DEBUG] Set total lessons to: ${totalLessons}.`);
            
            await course.save({ session }); 
            await session.commitTransaction();
            session.endSession();

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
            if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
                 return res.status(400).json({ success: false, message: 'A course with this title already exists. Please choose a different title.' });
            }
            if (error.name === 'ValidationError') {
                 return res.status(400).json({ success: false, message: error.message, errors: error.errors });
            }
            next(error); 
        }
    });


// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Course Instructor/Admin)
router.put('/:id',
    auth,
    authorize(['instructor', 'admin']),
    [ 
        body('title').optional().trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
        body('description').optional().trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
        body('category').optional().notEmpty().withMessage('Category cannot be empty'),
        body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).withMessage('Invalid level'), 
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number or zero')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        
        console.log("--- ✅ v10 (FINAL SYNC FIX) UPDATE COURSE FUNCTION IS RUNNING ---");

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            
            const { modules: modulesData, duration, accessPeriod, ...basicInfo } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                 await session.abortTransaction(); session.endSession();
                 return res.status(400).json({ success: false, message: 'Invalid course ID format' });
            }

            if (typeof Course.findById !== 'function') {
                console.error("[Debug PUT /:id] CRITICAL ERROR: Course.findById is not a function. Course variable:", Course);
                throw new Error("Internal Server Configuration Error: Course model not loaded correctly.");
            }
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
            if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                await session.abortTransaction();
                session.endSession();
                return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
            }

            course.set(basicInfo);
            course.duration = duration; 
            course.accessPeriod = accessPeriod; 

            const newOrUpdatedModules = [];
            const allLessonIdsInReq = new Set();
            const lessonsToCreate = [];
            const lessonUpdateOps = []; 

            if (modulesData && Array.isArray(modulesData)) {
                for (const [modIndex, modData] of modulesData.entries()) {
                    const lessonIdsForThisModule = [];
                    const moduleId = (modData._id && !modData._id.startsWith('temp_') && mongoose.Types.ObjectId.isValid(modData._id))
                                     ? modData._id
                                     : new mongoose.Types.ObjectId();

                    if (modData.lessons && Array.isArray(modData.lessons)) {
                        for (const [lesIndex, lesData] of modData.lessons.entries()) {
                             if (!lesData.title || !lesData.type) {
                                throw new Error(`Lesson validation failed: Missing title or type for lesson at module index ${modIndex}, lesson index ${lesIndex}.`);
                            }
                             if (lesData._id && !lesData._id.startsWith('temp_') && !mongoose.Types.ObjectId.isValid(lesData._id)) {
                                throw new Error(`Invalid Lesson ID format for lesson at module index ${modIndex}, lesson index ${lesIndex}.`);
                            }


                            if (lesData._id && !lesData._id.startsWith('temp_')) {
                                const lessonIdStr = lesData._id.toString();
                                allLessonIdsInReq.add(lessonIdStr);
                                lessonUpdateOps.push({
                                    updateOne: {
                                        filter: { _id: lesData._id, course: id }, 
                                        update: {
                                            $set: {
                                                title: lesData.title,
                                                type: lesData.type,
                                                content: lesData.content, 
                                                duration: lesData.duration || 0,
                                                order: lesData.order ?? lesIndex, 
                                                isPreview: lesData.isPreview || false,
                                                module: moduleId 
                                            }
                                        }
                                    }
                                });
                                lessonIdsForThisModule.push(lesData._id);
                            } else {
                                const newLesson = {
                                    ...lesData, 
                                    _id: new mongoose.Types.ObjectId(), 
                                    course: id,
                                    module: moduleId, 
                                    instructor: req.user.userId,
                                    order: lesData.order ?? lesIndex 
                                };
                                lessonsToCreate.push(newLesson);
                                lessonIdsForThisModule.push(newLesson._id);
                                allLessonIdsInReq.add(newLesson._id.toString());
                            }
                        }
                    }

                    newOrUpdatedModules.push({
                        _id: moduleId, 
                        title: modData.title,
                        description: modData.description,
                        order: modData.order ?? modIndex, 
                        lessons: lessonIdsForThisModule
                    });
                }
            }

            const existingLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.toString()));
            const lessonsToDelete = existingLessonIds.filter(id => !allLessonIdsInReq.has(id));
            if (lessonsToDelete.length > 0) {
                 console.log("[Debug Save] Deleting lessons:", lessonsToDelete);
                await Lesson.deleteMany({ _id: { $in: lessonsToDelete }, course: id }, { session });
                
                await Enrollment.updateMany(
                    { course: id },
                    { $pull: { "progress.completedLessons": { lesson: { $in: lessonsToDelete } } } },
                    { session }
                );
                console.log(`[DEBUG] Synced enrollments: Removed ${lessonsToDelete.length} lesson(s) from all enrollments.`);
            }

            if (lessonsToCreate.length > 0) {
                 console.log("[Debug Save] Creating lessons:", lessonsToCreate.length);
                await Lesson.insertMany(lessonsToCreate, { session });
            }

            if (lessonUpdateOps.length > 0) {
                 console.log("[Debug Save] Updating lessons:", lessonUpdateOps.length);
                await Lesson.bulkWrite(lessonUpdateOps, { session });
            }

            course.modules = newOrUpdatedModules;
            
            const totalLessons = await Lesson.countDocuments({ course: id }, { session });
            course.totalLessons = totalLessons;
            
            console.log(`--- ✅ REAL FIX APPLIED (UPDATE) ---`);
            console.log(`[DEBUG] Recalculated total lessons: ${totalLessons}. Forcing this value into the update.`);
            
            await course.save({ session }); 

            await session.commitTransaction();
            
            (async () => {
                try {
                    console.log(`[ASYNC SYNC] Starting sync for ${totalLessons} lessons on course ${id}`);
                    const enrollments = await Enrollment.find({ course: id }).select('_id progress status');
                    
                    const allLessonIdsInDb = (await Lesson.find({ course: id }).select('_id')).map(l => l._id.toString());
                    const allLessonIdsSet = new Set(allLessonIdsInDb);

                    for (const enr of enrollments) {
                        const originalCompleted = enr.progress.completedLessons.map(l => l.lesson.toString());
                        
                        const newCompletedLessonObjects = originalCompleted
                            .filter(id => allLessonIdsSet.has(id)) 
                            .map(lessonId => ({ lesson: lessonId })); 

                        const completedCount = newCompletedLessonObjects.length;
                        
                        const newPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
                        
                        const finalPercentage = Math.min(100, newPercentage);

                        let newStatus = enr.status;
                        let completedAtUpdate = enr.completedAt; 

                        if (finalPercentage >= 100 && enr.status !== 'completed') {
                            newStatus = 'completed';
                            completedAtUpdate = new Date(); 
                        } else if (finalPercentage < 100 && enr.status === 'completed') {
                            newStatus = 'active';
                            completedAtUpdate = undefined; 
                        }
                        
                        await Enrollment.updateOne(
                            { _id: enr._id },
                            { 
                                $set: { 
                                    'progress.percentageComplete': finalPercentage, 
                                    'status': newStatus,
                                    'progress.completedLessons': newCompletedLessonObjects, 
                                    'completedAt': completedAtUpdate 
                                } 
                            }
                        );
                    }
                    console.log(`[ASYNC SYNC] Finished syncing ${enrollments.length} enrollments.`);
                } catch (err) {
                    console.error(`[ASYNC SYNC ERROR] Failed to sync enrollments:`, err);
                }
            })();
            
            session.endSession();

            const finalUpdatedCourse = await Course.findById(id)
                .populate('instructor', 'name avatar bio socialLinks')
                .populate({
                    path: 'modules.lessons',
                    model: 'Lesson'
                });

            if (!finalUpdatedCourse) {
                 console.error(`[Error Update] Failed to retrieve updated course after save for ID: ${id}`);
                 return res.status(404).json({ success: false, message: 'Updated course could not be retrieved' });
            }
            
            const instructorId = finalUpdatedCourse.instructor._id;
            const instructorCourses = await Course.find({ 
              instructor: instructorId, 
              status: 'published' 
            }).select('enrollmentCount rating.average');
            
            const totalCourses = instructorCourses.length;
            const totalStudents = instructorCourses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
            const coursesWithRatings = instructorCourses.filter(c => c.rating && c.rating.average > 0);
            const totalRatingSum = coursesWithRatings.reduce((sum, c) => sum + c.rating.average, 0);
            const averageRating = coursesWithRatings.length > 0 ? (totalRatingSum / coursesWithRatings.length) : 0;
        
            let courseObj = finalUpdatedCourse.toObject();
        
            courseObj.instructor.students = totalStudents;
            courseObj.instructor.courses = totalCourses;
            courseObj.instructor.rating = parseFloat(averageRating.toFixed(1));

            res.json({ success: true, message: 'Course updated successfully', data: courseObj });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Update course error:', error);
            if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
                 return res.status(400).json({ success: false, message: 'A course with this title already exists. Please choose a different title.' });
            }
            if (error.name === 'ValidationError') {
                 console.error('Mongoose Validation Error details:', error.errors);
                 return res.status(400).json({ success: false, message: `Validation Failed: ${error.message}`, errors: error.errors });
            }
            next(error); 
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
             if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  await session.abortTransaction(); session.endSession();
                  return res.status(400).json({ success: false, message: 'Invalid course ID format' });
             }

            const course = await Course.findById(req.params.id).session(session);
            if (!course) {
                 await session.abortTransaction(); session.endSession();
                 return res.status(404).json({ success: false, message: 'Course not found' }); // 🐞 FIXED THE TYPO HERE
            }
            if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                 await session.abortTransaction(); session.endSession();
                 return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
            }
            const enrollmentCount = await Enrollment.countDocuments({ course: req.params.id }).session(session);
            if (enrollmentCount > 0) {
                 await session.abortTransaction(); session.endSession();
                 return res.status(400).json({ success: false, message: `Cannot delete course with ${enrollmentCount} active enrollments. Archive it instead?` });
            }

            await Lesson.deleteMany({ course: req.params.id }, { session });
            await Review.deleteMany({ course: req.params.id }, { session });
            
            await Enrollment.deleteMany({ course: req.params.id }, { session });
            console.log(`[Debug Delete] Deleted all enrollments for course ${req.params.id}`);

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

// 🐞 --- NEW ENDPOINT TO TOGGLE FEATURED --- 🐞
// @route   PATCH /api/courses/:id/toggle-featured
// @desc    Toggle a course's featured status
// @access  Private (Admin/Instructor)
router.patch(
  '/:id/toggle-featured',
  auth,
  authorize(['admin', 'instructor']),
  async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid course ID format' });
      }

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Authorize
      if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
      }

      // Flip the boolean value
      course.featured = !course.featured;

      await course.save();

      res.status(200).json({
        success: true,
        message: `Course featured status set to ${course.featured}`,
        data: course, // Send back the updated course
      });

    } catch (error) {
      console.error('Toggle featured error:', error);
      next(error);
    }
  }
);
// 🐞 --- END OF NEW ENDPOINT ---

// @route   POST /api/courses/:id/publish
// @desc    Publish or Unpublish course
// @access  Private (Course Instructor/Admin)
router.post('/:id/publish',
    auth,
    authorize(['instructor', 'admin']),
    async (req, res, next) => {
        try {
             if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  return res.status(400).json({ success: false, message: 'Invalid course ID format' });
             }

            const course = await Course.findById(req.params.id);
            if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
            if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                 return res.status(403).json({ success: false, message: 'Not authorized to publish this course' });
            }

            const isCurrentlyPublished = course.status === 'published';
            const targetStatus = isCurrentlyPublished ? 'draft' : 'published'; 

            if (targetStatus === 'published') {
                if (!course.thumbnail?.url || !course.description || course.modules.length === 0 || !course.modules.some(m => m.lessons && m.lessons.length > 0)) {
                    return res.status(400).json({ success: false, message: 'Course must have a thumbnail, description, and at least one lesson in one module to be published.' });
                }
                course.status = 'published';
                course.publishedAt = new Date();
            } else { 
                course.status = 'draft';
                course.publishedAt = undefined; 
            }

            await course.save();
            res.json({ success: true, message: `Course status updated to ${targetStatus} successfully`, data: course }); 
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
             if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  return res.status(400).json({ success: false, message: 'Invalid course ID format' });
             }

            const course = await Course.findById(req.params.id, 'instructor'); 
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
             if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                 return res.status(403).json({ success: false, message: 'Not authorized to view students for this course' });
            }


            const enrollments = await Enrollment.find({ course: req.params.id })
                .populate('student', 'name email avatar lastLogin') 
                .sort({ enrolledAt: -1 }) 
                .lean(); 

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
    upload.single('thumbnail'), 
    async (req, res, next) => {
        try {
             if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                  return res.status(400).json({ success: false, message: 'Invalid course ID format' });
             }

            const course = await Course.findById(req.params.id);
            if (!course) { return res.status(404).json({ success: false, message: 'Course not found' }); }
            if (course.instructor.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
            }
            if (!req.file) { return res.status(400).json({ success: false, message: 'No file uploaded. Please include a "thumbnail" file in your request.' }); }

            // TODO: Delete old thumbnail from Cloudinary using course.thumbnail.public_id if it exists

            course.thumbnail = {
                public_id: req.file.filename, 
                url: req.file.path 
            };
            await course.save();
            res.json({ success: true, message: 'Thumbnail updated successfully', data: { thumbnail: course.thumbnail } }); 
        } catch (error) {
            console.error('Upload thumbnail error:', error);
            next(error);
        }
    });


module.exports = router;