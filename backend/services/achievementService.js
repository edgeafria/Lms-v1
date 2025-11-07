const mongoose = require('mongoose');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Activity = require('../models/Activity');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');
const Certificate = require('../models/Certificate');

/**
 * A helper function to grant an achievement.
 * It checks if the user already has it, finds the achievement,
 * adds it to the user, and creates an activity log.
 * This is designed to be "fire and forget" - it runs in the background
 * and will not block the main request (e.g., login, lesson completion).
 *
 * @param {string} userId - The user's ID
 * @param {string} achievementCode - The unique code (e.g., 'FIRST_ENROLLMENT')
 */
const grantAchievement = async (userId, achievementCode) => {
  try {
    // 1. Find the user and the achievement definition simultaneously
    const [user, achievement] = await Promise.all([
      User.findById(userId).select('earnedAchievements'),
      Achievement.findOne({ code: achievementCode })
    ]);

    // 2. Check if user and achievement exist
    if (!user || !achievement) {
      if (!user) console.error(`AchievementService: User ${userId} not found.`);
      if (!achievement) console.error(`AchievementService: Achievement code ${achievementCode} not found in database.`);
      return;
    }

    // 3. Check if user already has this achievement
    const alreadyEarned = user.earnedAchievements.some(earnedId => earnedId.equals(achievement._id));
    if (alreadyEarned) {
      // console.log(`AchievementService: User ${userId} already has achievement ${achievementCode}.`);
      return;
    }

    // 4. Grant the achievement
    user.earnedAchievements.push(achievement._id);
    await user.save();

    // 5. Log the achievement as a new activity
    await Activity.create({
      user: userId,
      type: 'CERTIFICATE_EARNED', // Using 'CERTIFICATE_EARNED' as a generic "achievement" type
      message: `You earned an achievement: ${achievement.title}!`,
      course: null, // Achievements are not always tied to a course
    });

    console.log(`Achievement Granted: User ${userId} earned ${achievementCode}`);

  } catch (error) {
    // We catch and log the error here so that even if the achievement
    // logic fails (e.g., a database error), it doesn't crash the
    // main request (like the login or lesson completion).
    console.error(`Error in grantAchievement for ${userId} & ${achievementCode}:`, error.message);
  }
};

// --- Exportable Check Functions ---

/**
 * Checks for login-related achievements (e.g., streaks).
 * Called *after* user.loginStreak and user.lastLogin have been updated and saved.
 * @param {object} user - The full user object after streak logic.
 */
exports.checkLoginStreakAchievements = (user) => {
    if (user.loginStreak === 3) {
        grantAchievement(user._id, 'LOGIN_STREAK_3');
    }
    if (user.loginStreak === 7) {
        grantAchievement(user._id, 'LOGIN_STREAK_7');
    }
    // Add more streak checks (e.g., 30 days) here
};

/**
 * Checks for enrollment-related achievements.
 * Called *after* a new enrollment is successfully created.
 * @param {string} userId - The user's ID.
 */
exports.checkEnrollmentAchievements = async (userId) => {
    try {
        const enrollmentCount = await Enrollment.countDocuments({ student: userId });
        if (enrollmentCount === 1) {
            grantAchievement(userId, 'FIRST_ENROLLMENT');
        }
    } catch (error) { console.error("Error in checkEnrollmentAchievements:", error.message); }
};

/**
 * Checks for lesson-related achievements.
 * Called *after* a lesson is marked complete.
 * @param {string} userId - The user's ID.
 */
exports.checkLessonAchievements = async (userId) => {
     try {
        // Find how many unique lessons this user has completed
        const enrollment = await Enrollment.findOne({ student: userId }); // Find any enrollment
        const completedCount = enrollment?.progress?.completedLessons?.length || 0; // Get count from first enrollment found?
        // This logic is simple and just checks the first lesson.
        // A more robust check would aggregate *all* completed lessons across *all* enrollments.
        
        // For simplicity: check if this is the user's first *ever* completed lesson
        // Find *all* enrollments for the user
        const allEnrollments = await Enrollment.find({ student: userId }).select('progress.completedLessons');
        const totalCompletedLessons = allEnrollments.reduce((sum, enr) => sum + (enr.progress.completedLessons.length || 0), 0);

        if (totalCompletedLessons === 1) {
            grantAchievement(userId, 'FIRST_LESSON_COMPLETE');
        }
    } catch (error) { console.error("Error in checkLessonAchievements:", error.message); }
};

/**
 * Checks for quiz-related achievements.
 * Called *after* a quiz attempt is graded.
 * @param {string} userId - The user's ID.
 * @param {string} quizId - The quiz's ID.
 * @param {number} percentage - The score the user got (0-100).
 */
exports.checkQuizAchievements = (userId, quizId, percentage) => {
    if (percentage === 100) {
        grantAchievement(userId, 'PERFECT_QUIZ');
    }
    // Add more: e.g., "Completed 10 quizzes"
};

/**
 * Checks for review-related achievements.
 * Called *after* a review is successfully created.
 * @param {string} userId - The user's ID.
 */
exports.checkReviewAchievements = async (userId) => {
     try {
        const reviewCount = await Review.countDocuments({ student: userId });
        if (reviewCount === 1) {
            // Grant "First Review" achievement
            // grantAchievement(userId, 'FIRST_REVIEW'); // Add this code to Achievement model if you want it
        }
    } catch (error) { console.error("Error in checkReviewAchievements:", error.message); }
};

/**
 * Checks for certificate-related achievements.
 * Called *after* a certificate is successfully created.
 * @param {string} userId - The user's ID.
 */
exports.checkCertificateAchievements = async (userId) => {
     try {
        const certificateCount = await Certificate.countDocuments({ student: userId });
        if (certificateCount === 1) {
            // Grant "First Certificate" achievement
            // grantAchievement(userId, 'FIRST_CERTIFICATE'); // Add this code to Achievement model if you want it
        }
    } catch (error) { console.error("Error in checkCertificateAchievements:", error.message); }
};