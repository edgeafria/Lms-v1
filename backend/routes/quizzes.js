// In: backend/routes/quizzes.js
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Activity = require('../models/Activity');
const achievementService = require('../services/achievementService');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const mongoose = require('mongoose');

const router = express.Router();

// Utility to handle validation errors (Unchanged)
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
    next();
};

// @route   GET /api/quizzes (Unchanged)
router.get('/', auth, authorize(['instructor', 'admin']), async (req, res, next) => {
    try {
        const { course, page = 1, limit = 10 } = req.query;
        let filter = {};
        if (req.user.role === 'instructor') { filter.instructor = req.user.userId; }
        if (course) { filter.course = course; }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const quizzes = await Quiz.find(filter).populate('course', 'title').populate('instructor', 'name').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Quiz.countDocuments(filter);
        res.json({ success: true, data: quizzes, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total } });
    } catch (error) { console.error('Get quizzes error:', error); next(error); }
});

// --- ROUTE FIX: Handle temporary IDs and CastErrors at the start ---
// @route   GET /api/quizzes/lesson/:lessonId
// @desc    Get Quiz data associated with a specific Lesson
// @access  Private (Instructor/Admin)
router.get('/lesson/:lessonId', auth, authorize(['instructor', 'admin']), async (req, res, next) => {
    const lessonId = req.params.lessonId;
    
    // 1. Aggressively check if the ID is definitely NOT a Mongoose ObjectId.
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        // If the ID starts with our frontend temp prefix ('les_...'), assume no quiz exists yet.
        if (lessonId.startsWith('les_')) {
             console.log(`[Quiz Route] Temporary Lesson ID (${lessonId}). Returning null data.`);
             return res.json({ success: true, data: null, message: 'Lesson is new, no existing quiz found.' });
        }
        
        // If it's a bad format that isn't our temp prefix, return 404 to prevent server crash.
        console.log(`[Quiz Route] Invalid non-temp ID format (${lessonId}). Returning 404.`);
        return res.status(404).json({ success: false, message: 'Invalid lesson ID format.' });
    }

    // 2. If it is a valid ObjectId format, proceed with the database query.
    try {
        const lesson = await Lesson.findById(lessonId).select('course module content').populate('content.quiz');
        
        if (!lesson) {
            // Mongoose didn't crash, but the ID didn't match a document.
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        // 3. Verify user owns the course
        const course = await Course.findById(lesson.course);
        if (!course || (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId.toString())) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this lesson\'s quiz' });
        }
        
        // Return the populated quiz data
        res.json({ success: true, data: lesson.content?.quiz });

    } catch (error) {
        // Since we checked isValidObjectId, this catch block is for genuine DB issues.
        console.error('Get Quiz by Lesson ID error:', error);
        next(error);
    }
});
// --- END ROUTE FIX ---


// @route   GET /api/quizzes/:id (Unchanged)
router.get('/:id', auth, async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('course', 'title instructor')
            .populate('instructor', 'name avatar');
        if (!quiz) { return res.status(404).json({ success: false, message: 'Quiz not found' }); }
        let canAccess = false;
        if (req.user.role === 'admin') { canAccess = true; }
        else if (req.user.role === 'instructor') { if (quiz.instructor?._id?.toString() === req.user.userId?.toString()) { canAccess = true; } }
        else if (req.user.role === 'student') { const enrollment = await Enrollment.findOne({ student: req.user.userId, course: quiz.course._id, status: 'active' }); if (enrollment) { canAccess = true; } }
        if (!canAccess) { return res.status(403).json({ success: false, message: 'Not authorized to access this quiz' }); }
        res.json({ success: true, data: quiz });
    } catch (error) { console.error('Get quiz error:', error); next(error); }
});


// @route   POST /api/quizzes (Unchanged)
router.post('/',
    auth,
    authorize(['instructor', 'admin']),
    [ // Validation
      body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
      body('course').isMongoId().withMessage('Valid course ID is required'),
      body('lesson').isMongoId().withMessage('Valid lesson ID is required'),
      body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { title, description, course, lesson, questions, settings, instructions, existingQuizId } = req.body;
            
            // 1. Verify ownership
            const courseDoc = await Course.findById(course);
            if (!courseDoc) { return res.status(404).json({ success: false, message: 'Course not found' }); }
            if (req.user.role === 'instructor' && courseDoc.instructor.toString() !== req.user.userId.toString()) {
              return res.status(403).json({ success: false, message: 'Not authorized to create quiz for this course' });
            }

            // 2. Calculate points
            let totalPoints = 0;
            for (let i = 0; i < questions.length; i++) { questions[i].order = i + 1; totalPoints += questions[i].points || 1; }
            
            const quizData = { 
                title, description, course, lesson, instructor: req.user.userId, questions, 
                settings: settings || {}, instructions, totalPoints 
            };

            let quiz;

            // 3. Update or Create Quiz
            if (existingQuizId && mongoose.Types.ObjectId.isValid(existingQuizId)) {
                // Update existing quiz
                quiz = await Quiz.findByIdAndUpdate(existingQuizId, quizData, { new: true, runValidators: true });
                if (!quiz) { throw new Error("Quiz not found for update."); }
                console.log(`Quiz updated: ${quiz._id}`);
            } else {
                // Create new quiz
                quiz = new Quiz(quizData);
                await quiz.save();
                console.log(`New Quiz created: ${quiz._id}`);

                // 4. Link Quiz to Lesson (Only on CREATE)
                await Lesson.findByIdAndUpdate(lesson, {
                    $set: { 'content.quiz': quiz._id, type: 'quiz' }
                });
                console.log(`Lesson ${lesson} linked to Quiz ${quiz._id}`);
            }
            
            await quiz.populate('course', 'title'); await quiz.populate('instructor', 'name');
            res.status(201).json({ success: true, message: 'Quiz saved successfully', data: quiz });
        } catch (error) { 
            console.error('Create/Update quiz error:', error); 
            next(error); 
        }
    });

// @route   PUT /api/quizzes/:id (Unchanged)
router.put('/:id',
    auth,
    authorize(['instructor', 'admin']),
    [ /* validation */ ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const quiz = await Quiz.findById(req.params.id);
            if (!quiz) { return res.status(404).json({ success: false, message: 'Quiz not found' }); }
            if (req.user.role === 'instructor' && quiz.instructor.toString() !== req.user.userId.toString()) { return res.status(403).json({ success: false, message: 'Not authorized to update this quiz' }); }
            if (req.body.questions) { req.body.questions.forEach((question, index) => { question.order = index + 1; }); req.body.totalPoints = req.body.questions.reduce((sum, q) => sum + (q.points || 1), 0); }
            delete req.body.course; delete req.body.lesson; delete req.body.instructor;
            const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('course', 'title').populate('instructor', 'name');
            res.json({ success: true, message: 'Quiz updated successfully', data: updatedQuiz });
        } catch (error) { console.error('Update quiz error:', error); next(error); }
    });

// @route   DELETE /api/quizzes/:id (Unchanged)
router.delete('/:id',
    auth,
    authorize(['instructor', 'admin']),
    async (req, res, next) => {
        try {
            const quiz = await Quiz.findById(req.params.id);
            if (!quiz) { return res.status(404).json({ success: false, message: 'Quiz not found' }); }
            if (req.user.role === 'instructor' && quiz.instructor.toString() !== req.user.userId.toString()) { return res.status(403).json({ success: false, message: 'Not authorized to delete this quiz' }); }
            const hasAttempts = await Enrollment.exists({ 'quizAttempts.quiz': req.params.id });
            if (hasAttempts) { return res.status(400).json({ success: false, message: 'Cannot delete quiz with existing attempts' }); }
            await Quiz.findByIdAndDelete(req.params.id);
            // Also unlink from lesson
            await Lesson.findOneAndUpdate({ 'content.quiz': req.params.id }, { $set: { 'content.quiz': null } });
            res.json({ success: true, message: 'Quiz deleted successfully' });
        } catch (error) { console.error('Delete quiz error:', error); next(error); }
    });

// @route   POST /api/quizzes/:id/attempt (Unchanged)
router.post('/:id/attempt',
    auth,
    authorize(['student']),
    [
      body('answers').isArray().withMessage('Answers array is required'),
      body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive number')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { answers, timeSpent = 0 } = req.body;
            const quiz = await Quiz.findById(req.params.id);
            if (!quiz) { return res.status(404).json({ success: false, message: 'Quiz not found' }); }

            const enrollment = await Enrollment.findOne({ student: req.user.userId, course: quiz.course, status: 'active' });
            if (!enrollment) { return res.status(403).json({ success: false, message: 'You must be enrolled in this course to take the quiz' }); }

            const existingQuizAttempt = enrollment.quizAttempts.find( qa => qa.quiz.toString() === req.params.id );
            if (existingQuizAttempt && existingQuizAttempt.attempts.length >= (quiz.settings.attempts || 1) ) {
                return res.status(400).json({ success: false, message: 'Maximum attempts reached for this quiz' });
            }

            // --- Grading Logic ---
            let totalScore = 0; let totalPoints = 0; const gradedAnswers = [];
            for (const question of quiz.questions) {
                const userAnswer = answers.find(a => a.questionId === question._id.toString());
                totalPoints += question.points;
                if (!userAnswer) { gradedAnswers.push({ questionId: question._id.toString(), answer: null, isCorrect: false, points: 0 }); continue; }
                let isCorrect = false; let points = 0;
                if (question.type === 'multiple-choice' || question.type === 'true-false') {
                    const correctOptions = question.options.filter(opt => opt.isCorrect); const userAnswerArray = Array.isArray(userAnswer.answer) ? userAnswer.answer : [userAnswer.answer];
                    if (question.type === 'multiple-choice') {
                        const correctIds = correctOptions.map(opt => opt._id.toString());
                        isCorrect = correctIds.length === userAnswerArray.length && correctIds.every(id => userAnswerArray.includes(id));
                    } else { isCorrect = correctOptions.some(opt => opt._id.toString() === userAnswerArray[0]); }
                    if (isCorrect) { points = question.points; totalScore += points; }
                } else if (question.type === 'short-answer') {
                    if (question.correctAnswer && userAnswer.answer) {
                        isCorrect = question.correctAnswer.toLowerCase().trim() === userAnswer.answer.toLowerCase().trim();
                        if (isCorrect) { points = question.points; totalScore += points; }
                    }
                }
                gradedAnswers.push({ questionId: question._id.toString(), answer: userAnswer.answer, isCorrect, points });
            }
            const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
            const passed = percentage >= (quiz.settings.passingScore || 70);
            const attempt = { score: totalScore, totalPoints, percentage, passed, answers: gradedAnswers, timeSpent, attemptedAt: new Date() };
            // --- End Grading Logic ---

            if (existingQuizAttempt) {
                existingQuizAttempt.attempts.push(attempt);
                existingQuizAttempt.bestScore = Math.max(existingQuizAttempt.bestScore, totalScore);
                existingQuizAttempt.passed = existingQuizAttempt.passed || passed;
            } else {
                enrollment.quizAttempts.push({ quiz: req.params.id, attempts: [attempt], bestScore: totalScore, passed });
            }
            await enrollment.save();

            quiz.analytics.totalAttempts = (quiz.analytics.totalAttempts || 0) + 1;
            await quiz.save();

            // --- 2. RECORD ACTIVITY ---
            try {
                await Activity.create({
                    user: req.user.userId,
                    type: 'QUIZ_ATTEMPT',
                    message: `You ${passed ? 'passed' : 'attempted'} the quiz: ${quiz.title} (Score: ${percentage}%)`,
                    course: quiz.course,
                    quiz: quiz._id,
                });
                console.log(`Activity logged: User ${req.user.userId} attempted quiz ${quiz._id}`);
            } catch (activityError) {
                console.error('Failed to log quiz attempt activity:', activityError);
            }
            
            // --- 3. CHECK FOR ACHIEVEMENTS ---
            achievementService.checkQuizAchievements(req.user.userId, quiz._id, percentage);
            // ---------------------------------

            res.json({
                success: true, message: 'Quiz submitted successfully',
                data: { score: totalScore, totalPoints, percentage, passed, showResults: quiz.settings.showResults !== 'never', showCorrectAnswers: quiz.settings.showCorrectAnswers && quiz.settings.showResults === 'immediately', answers: quiz.settings.showResults === 'immediately' ? gradedAnswers : undefined }
            });
        } catch (error) {
            console.error('Submit quiz attempt error:', error);
            next(error);
        }
    });

// @route   GET /api/quizzes/:id/attempts (Unchanged)
router.get('/:id/attempts', auth, authorize(['student']), async (req, res, next) => {
    try {
        const enrollment = await Enrollment.findOne({ student: req.user.userId, 'quizAttempts.quiz': req.params.id });
        if (!enrollment) { return res.json({ success: true, data: { attempts: [], bestScore: 0, passed: false } }); }
        const quizAttempt = enrollment.quizAttempts.find( qa => qa.quiz.toString() === req.params.id );
        res.json({ success: true, data: quizAttempt || { attempts: [], bestScore: 0, passed: false } });
    } catch (error) {
        console.error('Get quiz attempts error:', error);
        next(error);
    }
});

module.exports = router;