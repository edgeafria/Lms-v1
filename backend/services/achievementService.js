const mongoose = require('mongoose');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Activity = require('../models/Activity');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');
const Certificate = require('../models/Certificate');
const Course = require('../models/Course'); // <-- We need this for category checks

/**
 * A helper function to grant an achievement.
 * IT MODIFIES THE USER OBJECT IN MEMORY AND DOES NOT SAVE.
 * It returns the achievement object if granted, or null.
 */
const grantAchievement = async (user, achievementCode) => {
  try {
    // 1. Find the achievement definition
    const achievement = await Achievement.findOne({ code: achievementCode });

    // 2. Check if user and achievement exist
    if (!user) {
        console.error(`AchievementService: User object is null.`);
        return null;
    }
    if (!achievement) {
      console.error(`AchievementService: Achievement code ${achievementCode} not found in database.`);
      return null;
    }

    // 3. Check if user already has this achievement
    const alreadyEarned = user.earnedAchievements.some(earnedId => earnedId.equals(achievement._id));
    if (alreadyEarned) {
      // console.log(`AchievementService: User ${user._id} already has achievement ${achievementCode}.`);
      return null; // Not newly granted
    }

    // 4. Grant the achievement (in memory)
    user.earnedAchievements.push(achievement._id);

    console.log(`Achievement Granted (in memory): User ${user._id} earned ${achievementCode}`);
    return achievement; // Return the full achievement object

  } catch (error) {
    console.error(`Error in grantAchievement for ${user._id} & ${achievementCode}:`, error.message);
    return null;
  }
};

// --- Exportable Check Functions ---

/**
 * Checks for login-related achievements.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkLoginStreakAchievements = async (user) => {
    const newAchievements = [];
    
    // Check for each streak achievement. grantAchievement prevents duplicates.
    if (user.loginStreak >= 3) {
        const ach = await grantAchievement(user, 'LOGIN_STREAK_3');
        if (ach) newAchievements.push(ach);
    }
    if (user.loginStreak >= 7) {
        const ach = await grantAchievement(user, 'LOGIN_STREAK_7');
        if (ach) newAchievements.push(ach);
    }
    // --- 🐞 ADDED NEW CHECKS ---
    if (user.loginStreak >= 14) {
        const ach = await grantAchievement(user, 'LOGIN_STREAK_14');
        if (ach) newAchievements.push(ach);
    }
    if (user.loginStreak >= 30) {
        const ach = await grantAchievement(user, 'LOGIN_STREAK_30');
        if (ach) newAchievements.push(ach);
    }
    // --- END NEW CHECKS ---

    return newAchievements; // Return the list of new achievements
};

/**
 * Checks for enrollment-related achievements.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkEnrollmentAchievements = async (user) => {
    try {
        const newAchievements = [];
        
        // Find all enrollments and populate the course category
        const allEnrollments = await Enrollment.find({ student: user._id }).select('course').populate('course', 'category');
        const enrollmentCount = allEnrollments.length;

        // --- 🐞 ADDED COUNT CHECKS ---
        if (enrollmentCount === 1) {
            const ach = await grantAchievement(user, 'FIRST_ENROLLMENT');
            if (ach) newAchievements.push(ach);
        }
        if (enrollmentCount === 5) {
            const ach = await grantAchievement(user, 'ENROLLMENT_5');
            if (ach) newAchievements.push(ach);
        }
        if (enrollmentCount === 10) {
            const ach = await grantAchievement(user, 'ENROLLMENT_10');
            if (ach) newAchievements.push(ach);
        }
        // --- END COUNT CHECKS ---

        // --- 🐞 ADDED CATEGORY CHECKS ---
        const categories = allEnrollments.map(enr => enr.course.category).filter(Boolean); // Get all categories
        
        // Check for "Explorer" (3+ different categories)
        const uniqueCategories = new Set(categories);
        if (uniqueCategories.size >= 3) {
            const ach = await grantAchievement(user, 'EXPLORER_3');
            if (ach) newAchievements.push(ach);
        }

        // Check for "Specialist" (3+ courses in the *same* category)
        const categoryCounts = categories.reduce((acc, cat) => {
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});
        
        if (Object.values(categoryCounts).some(count => count >= 3)) {
             const ach = await grantAchievement(user, 'SPECIALIST_3');
             if (ach) newAchievements.push(ach);
        }
        // --- END CATEGORY CHECKS ---

        return newAchievements;
    } catch (error) { 
        console.error("Error in checkEnrollmentAchievements:", error.message); 
        return [];
    }
};

/**
 * Checks for lesson-related achievements.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkLessonAchievements = async (user) => {
     try {
        const allEnrollments = await Enrollment.find({ student: user._id }).select('progress.completedLessons');
        const totalCompletedLessons = allEnrollments.reduce((sum, enr) => sum + (enr.progress.completedLessons.length || 0), 0);
        const newAchievements = [];

        if (totalCompletedLessons === 1) {
            const ach = await grantAchievement(user, 'FIRST_LESSON_COMPLETE');
            if (ach) newAchievements.push(ach);
        }
        // --- 🐞 ADDED COUNT CHECKS ---
        if (totalCompletedLessons === 10) {
            const ach = await grantAchievement(user, 'LESSONS_10');
            if (ach) newAchievements.push(ach);
        }
        if (totalCompletedLessons === 50) {
            const ach = await grantAchievement(user, 'LESSONS_50');
            if (ach) newAchievements.push(ach);
        }
        // --- END COUNT CHECKS ---
        
        return newAchievements;
    } catch (error) { 
        console.error("Error in checkLessonAchievements:", error.message); 
        return [];
    }
};

/**
 * Checks for a single perfect quiz score.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkQuizAchievements = async (user, percentage) => {
    const newAchievements = [];
    if (percentage === 100) {
        const ach = await grantAchievement(user, 'PERFECT_QUIZ');
        if (ach) newAchievements.push(ach);
    }
    return newAchievements;
};

/**
 * 🐞 NEW FUNCTION
 * Checks for quiz pass counts.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkQuizPassAchievements = async (user) => {
    try {
        const newAchievements = [];
        const allEnrollments = await Enrollment.find({ student: user._id }).select('quizAttempts.quiz quizAttempts.attempts.passed');
        
        const passedQuizIds = new Set();
        allEnrollments.forEach(enr => {
            if (enr.quizAttempts) {
                enr.quizAttempts.forEach(quiz => {
                    // Check if *any* attempt for this quiz was passed
                    const hasPassed = quiz.attempts.some(att => att.passed === true);
                    if (hasPassed && quiz.quiz) {
                        passedQuizIds.add(quiz.quiz.toString());
                    }
                });
            }
        });

        if (passedQuizIds.size >= 5) {
            const ach = await grantAchievement(user, 'QUIZ_PASS_5');
            if (ach) newAchievements.push(ach);
        }
        return newAchievements;
    } catch (error) {
        console.error("Error in checkQuizPassAchievements:", error.message); 
        return [];
    }
};


/**
 * Checks for review-related achievements.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkReviewAchievements = async (user) => {
     try {
        const reviewCount = await Review.countDocuments({ student: user._id });
        const newAchievements = [];
        if (reviewCount === 1) {
            // --- 🐞 UNCOMMENTED ---
            const ach = await grantAchievement(user, 'FIRST_REVIEW'); 
            if (ach) newAchievements.push(ach);
        }
        return newAchievements;
    } catch (error) { 
        console.error("Error in checkReviewAchievements:", error.message); 
        return [];
    }
};

/**
 * 🐞 NEW FUNCTION
 * Checks for assignment-related achievements.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkAssignmentAchievements = async (user) => {
    try {
        const newAchievements = [];
        const allEnrollments = await Enrollment.find({ student: user._id }).select('assignments.status');
        
        let totalSubmitted = 0;
        allEnrollments.forEach(enr => {
            if (enr.assignments) {
                enr.assignments.forEach(assign => {
                    if (assign.status === 'submitted' || assign.status === 'graded') {
                        totalSubmitted++;
                    }
                });
            }
        });

        if (totalSubmitted === 1) {
            const ach = await grantAchievement(user, 'FIRST_ASSIGNMENT');
            if (ach) newAchievements.push(ach);
        }
        return newAchievements;
    } catch (error) {
        console.error("Error in checkAssignmentAchievements:", error.message);
        return [];
    }
};


/**
 * 🐞 NEW FUNCTION (was missing from your file)
 * Checks for course completion achievements.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkCourseCompletionAchievements = async (user) => {
    try {
        const newAchievements = [];
        const completedCount = await Enrollment.countDocuments({ student: user._id, status: 'completed' });

        if (completedCount === 1) {
            const ach = await grantAchievement(user, 'FIRST_COURSE_COMPLETE');
            if (ach) newAchievements.push(ach);
        }
        if (completedCount === 3) {
            const ach = await grantAchievement(user, 'COMPLETE_3_COURSES');
            if (ach) newAchievements.push(ach);
        }
        return newAchievements;
    } catch (error) {
        console.error("Error in checkCourseCompletionAchievements:", error.message);
        return [];
    }
};


/**
 * Checks for certificate-related achievements.
 * MODIFIES THE USER OBJECT. DOES NOT SAVE.
 */
exports.checkCertificateAchievements = async (user) => {
     try {
        const certificateCount = await Certificate.countDocuments({ student: user._id });
        const newAchievements = [];
        if (certificateCount === 1) {
            // --- 🐞 UNCOMMENTED ---
            const ach = await grantAchievement(user, 'FIRST_CERTIFICATE');
            if (ach) newAchievements.push(ach);
        }
        return newAchievements;
    } catch (error) { 
        console.error("Error in checkCertificateAchievements:", error.message); 
        return [];
    }
};