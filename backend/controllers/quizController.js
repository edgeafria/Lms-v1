const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Lesson = require('../models/Lesson'); // Required
const Activity = require('../models/Activity'); // Required
const achievementService = require('../services/achievementService'); // Required
const { validationResult } = require('express-validator');
const mongoose = require('mongoose'); // Required

// @desc    Get all quizzes (filtered for instructor/admin)
// @route   GET /api/quizzes
// @access  Private (Instructor/Admin)
exports.getAll = async (req, res, next) => {
    try {
        const { course, page = 1, limit = 10 } = req.query;
        let filter = {};
        if (req.user.role === 'instructor') {
            const instructorCourses = await Course.find({ instructor: req.user.userId }).select('_id');
            const courseIds = instructorCourses.map(c => c._id);
            filter.course = { $in: courseIds };
        }
        if (course) {
            if (req.user.role === 'instructor' && (!filter.course || !filter.course.$in.some(id => id.equals(course)))) {
                 return res.status(403).json({ success: false, message: 'Not authorized to view quizzes for this course' });
            }
            filter.course = course;
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const quizzes = await Quiz.find(filter).populate('course', 'title').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Quiz.countDocuments(filter);
        res.json({ success: true, data: quizzes, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), total } });
    } catch (error) { console.error('Get quizzes error:', error); next(error); }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private (Enrolled Student/Instructor/Admin)
exports.getOne = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('course', 'title instructor');
        if (!quiz) { return res.status(404).json({ success: false, message: 'Quiz not found' }); }
        let canAccess = false;
        if (req.user.role === 'admin') { canAccess = true; }
        // --- FIX: Check quiz.course.instructor (which is populated) ---
        else if (req.user.role === 'instructor' && quiz.course?.instructor?.toString() === req.user.userId.toString()) { canAccess = true; }
        else if (req.user.role === 'student') {
            const enrollment = await Enrollment.findOne({ student: req.user.userId, course: quiz.course._id, status: 'active' });
            if (enrollment) { canAccess = true; }
        }
        if (!canAccess) { return res.status(403).json({ success: false, message: 'Not authorized to access this quiz' }); }
        res.json({ success: true, data: quiz });
    } catch (error) { console.error('Get quiz error:', error); next(error); }
};

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private (Instructor/Admin)
exports.create = async (req, res, next) => {
    // This route is used by CourseBuilder (POST /api/quizzes)
    // It's a create OR update (upsert) logic
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }

        const { title, description, course, lesson, questions, settings, instructions, existingQuizId } = req.body;

        const courseDoc = await Course.findById(course);
        if (!courseDoc) { return res.status(404).json({ success: false, message: 'Course not found' }); }

        if (req.user.role === 'instructor' && courseDoc.instructor.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to create quiz for this course' });
        }

        // Calculate total points
        let totalPoints = 0;
        if (questions && Array.isArray(questions)) {
            for (let i = 0; i < questions.length; i++) { 
                questions[i].order = i + 1; 
                totalPoints += questions[i].points || 1; 
            }
        }

        const quizData = { 
            title, 
            description, 
            course, 
            lesson, 
            instructor: req.user.userId, 
            questions, 
            settings: settings || {}, 
            instructions, 
            totalPoints,
            passingScore: settings?.passingScore || 70, // Ensure passingScore is set on Quiz
        };

        let quiz;

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

            // Link Quiz to Lesson (Only on CREATE)
            await Lesson.findByIdAndUpdate(lesson, {
                $set: { 'content.quiz': quiz._id, type: 'quiz' }
            });
            console.log(`Lesson ${lesson} linked to Quiz ${quiz._id}`);
        }
        
        await quiz.populate('course', 'title instructor'); // Repopulate course
        res.status(201).json({ success: true, message: 'Quiz saved successfully', data: quiz });
    } catch (error) { 
        console.error('Create/Update quiz error:', error); 
        next(error); 
    }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Quiz Instructor/Admin)
exports.update = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
        
        const quiz = await Quiz.findById(req.params.id).populate('course', 'instructor');
        if (!quiz) { return res.status(404).json({ success: false, message: 'Quiz not found' }); }
        
        if (req.user.role === 'instructor' && quiz.course.instructor.toString() !== req.user.userId.toString()) { 
            return res.status(403).json({ success: false, message: 'Not authorized to update this quiz' }); 
        }
        
        // Recalculate total points if questions are being updated
        if (req.body.questions) { 
            req.body.totalPoints = req.body.questions.reduce((sum, q, index) => {
                q.order = index + 1;
                return sum + (q.points || 1);
            }, 0);
        }
        
        // Prevent changing core associations
        delete req.body.course; 
        delete req.body.lesson;
        delete req.body.instructor;

        const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('course', 'title instructor')
            .populate('instructor', 'name'); // Repopulate instructor too
            
        res.json({ success: true, message: 'Quiz updated successfully', data: updatedQuiz });
    } catch (error) { console.error('Update quiz error:', error); next(error); }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Quiz Instructor/Admin)
exports.remove = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('course', 'instructor');
        if (!quiz) { return res.status(404).json({ success: false, message: 'Quiz not found' }); }
        
        if (req.user.role === 'instructor' && quiz.course.instructor.toString() !== req.user.userId.toString()) { 
            return res.status(403).json({ success: false, message: 'Not authorized to delete this quiz' }); 
        }
        
        const hasAttempts = await Enrollment.exists({ 'quizAttempts.quiz': req.params.id });
        if (hasAttempts) { return res.status(400).json({ success: false, message: 'Cannot delete quiz with existing student attempts. Consider unpublishing instead.' }); }
        
        await Quiz.findByIdAndDelete(req.params.id);
        
        // Also unlink from lesson
        await Lesson.findOneAndUpdate({ 'content.quiz': req.params.id }, { $set: { 'content.quiz': null } });
        
        res.json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) { console.error('Delete quiz error:', error); next(error); }
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/attempt
// @access  Private (Student)
exports.submitAttempt = async (req, res, next) => {
     try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() }); }
        
        const { answers, timeSpent = 0 } = req.body;
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) { return res.status(404).json({ success: false, message: 'Quiz not found' }); }

        const enrollment = await Enrollment.findOne({ student: req.user.userId, course: quiz.course, status: 'active' });
        if (!enrollment) { return res.status(403).json({ success: false, message: 'You must be actively enrolled in this course to take the quiz' }); }

        let quizAttemptRecord = enrollment.quizAttempts.find(qa => qa.quiz.equals(quiz._id));
        const maxAttempts = quiz.settings?.attempts || 1; // Default 1 attempt
        
        if (maxAttempts > 0 && quizAttemptRecord && quizAttemptRecord.attempts.length >= maxAttempts) { 
            return res.status(400).json({ success: false, message: `Maximum attempts (${maxAttempts}) reached for this quiz` }); 
        }

        // --- START GRADING LOGIC ---
        let totalScore = 0;
        let totalPoints = 0; // Total *possible* points for auto-graded questions
        let hasEssay = false;
        const gradedAnswers = [];

        for (const question of quiz.questions) {
            const userAnswerData = answers.find(a => a.questionId === question._id.toString());
            const userAnswer = userAnswerData ? userAnswerData.answer : null; // This is the option ID or text
            
            let isCorrect = false;
            let points = 0;
            
            if (question.type === 'multiple-choice' || question.type === 'true-false') {
                totalPoints += question.points || 1; // This question is auto-gradable
                const correctOption = question.options.find(opt => opt.isCorrect);
                
                if (correctOption && userAnswer && correctOption._id.toString() === userAnswer) {
                    isCorrect = true;
                    points = question.points || 1;
                    totalScore += points;
                }
            } else if (question.type === 'short-answer') {
                totalPoints += question.points || 1; // This question is auto-gradable
                if (question.correctAnswer && userAnswer) {
                    isCorrect = question.correctAnswer.toLowerCase().trim() === String(userAnswer).toLowerCase().trim();
                    if (isCorrect) {
                        points = question.points || 1;
                        totalScore += points;
                    }
                }
            } else if (question.type === 'essay') {
                hasEssay = true; // Mark quiz as needing manual grading
                // Essays are not graded automatically, so isCorrect is false and points is 0
            }

            gradedAnswers.push({
                questionId: question._id.toString(),
                answer: userAnswer,
                isCorrect: isCorrect,
                points: points
            });
        }
        
        // Calculate percentage based *only* on auto-gradable questions
        const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
        const passingScore = quiz.passingScore || 70;
        
        // --- FIX: Only mark as 'passed' if there are NO essays AND percentage is met ---
        const passed = !hasEssay && percentage >= passingScore;
        // --- END FIX ---
        
        const newAttempt = { 
            score: totalScore, 
            totalPoints: totalPoints, // Store the total points that were auto-graded
            percentage: percentage, 
            passed: passed, 
            answers: gradedAnswers, 
            timeSpent, 
            attemptedAt: new Date() 
        };
        // --- END GRADING LOGIC ---

        if (quizAttemptRecord) {
            quizAttemptRecord.attempts.push(newAttempt);
            quizAttemptRecord.bestScore = Math.max(quizAttemptRecord.bestScore || 0, totalScore);
            quizAttemptRecord.passed = quizAttemptRecord.passed || passed; // Only true if passed and no essays
        } else {
            enrollment.quizAttempts.push({ 
                quiz: quiz._id, 
                attempts: [newAttempt], 
                bestScore: totalScore, 
                passed: passed 
            });
        }
        await enrollment.save();
        
        // Update quiz analytics
        quiz.analytics.totalAttempts = (quiz.analytics.totalAttempts || 0) + 1;
        if(passed) {
             quiz.analytics.passRate = (quiz.analytics.passRate || 0); // This logic needs review, maybe avg pass rate?
        }
        await quiz.save();

        // --- Log Activity ---
        try {
            await Activity.create({
                user: req.user.userId,
                type: 'QUIZ_ATTEMPT',
                message: `You ${passed ? 'passed' : 'attempted'} the quiz: ${quiz.title} (Score: ${percentage}%)`,
                course: quiz.course,
                quiz: quiz._id,
            });
        } catch (activityError) {
            console.error('Failed to log quiz attempt activity:', activityError);
        }
        
        // --- Check Achievements ---
        achievementService.checkQuizAchievements(req.user.userId, quiz._id, percentage);
        
        // --- Prepare Response ---
        const showResults = quiz.settings?.showResults !== 'never';
        // Only show correct answers if setting is true AND it was an immediate show
        const showCorrectAnswers = quiz.settings?.showCorrectAnswers && quiz.settings?.showResults === 'immediately';

        res.json({
            success: true, 
            message: 'Quiz submitted successfully',
            data: { 
                score: totalScore, 
                totalPoints: totalPoints, // Send auto-graded total
                percentage, 
                passed, 
                showResults,
                showCorrectAnswers,
                // Only send answer details if results are shown immediately
                answers: showResults ? gradedAnswers : undefined 
            }
        });
    } catch (error) { 
        console.error('Submit quiz attempt error:', error); 
        next(error); 
    }
};

// @desc    Get quiz attempts for a student
// @route   GET /api/quizzes/:id/attempts
// @access  Private (Student)
exports.getAttempts = async (req, res, next) => {
     try {
        const enrollment = await Enrollment.findOne({ student: req.user.userId, 'quizAttempts.quiz': req.params.id })
            .populate({ path: 'quizAttempts.quiz', select: 'title settings passingScore' });
            
        if (!enrollment) { 
            return res.json({ success: true, data: { attempts: [], bestScore: 0, passed: false } }); 
        }
        
        const quizAttemptRecord = enrollment.quizAttempts.find(qa => qa.quiz._id.equals(req.params.id));
        if (!quizAttemptRecord) { 
            return res.json({ success: true, data: { attempts: [], bestScore: 0, passed: false } }); 
        }
        
        // TODO: Potentially hide answers based on quiz settings
        
        res.json({ success: true, data: quizAttemptRecord });
    } catch (error) { console.error('Get quiz attempts error:', error); next(error); }
};