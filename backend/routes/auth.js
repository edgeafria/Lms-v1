const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');
const achievementService = require('../services/achievementService'); // <-- 1. Import Service

const router = express.Router();

if (!process.env.GOOGLE_CLIENT_ID) {
    console.error("FATAL ERROR: Missing GOOGLE_CLIENT_ID in backend .env file!");
}
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- Utility Functions ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    next();
};

const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const getStartOfDay = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
};
// -------------------------------------------------

// @route   POST /api/auth/register
router.post('/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['student', 'instructor']).withMessage('Invalid role')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { name, email, password, role = 'student' } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) { return res.status(400).json({ success: false, message: 'User already exists with this email' }); }
        const user = new User({ name, email, password, role });
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
        await sendEmail({ email: user.email, subject: 'Verify Your Email - Edges Africa', template: 'emailVerification', data: { name: user.name, verificationUrl } });
        res.status(201).json({ success: true, message: 'User registered successfully. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Registration error:', error);
        next(error);
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { email, password, twoFactorToken } = req.body;
        const user = await User.findOne({ email }).select('+password +socialLogin +lastLogin +loginStreak +earnedAchievements'); // Select fields
        if (!user) { return res.status(401).json({ success: false, message: 'Invalid credentials' }); }
        if (!user.password && user.socialLogin?.google?.id) {
             return res.status(400).json({ success: false, message: 'Account created with Google. Please use Sign in with Google.' });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) { return res.status(401).json({ success: false, message: 'Invalid credentials' }); }
        if (!user.isActive) { return res.status(401).json({ success: false, message: 'Account has been deactivated' }); }
        if (user.twoFactorEnabled) { /* 2FA logic */ }

        // --- LOGIN STREAK LOGIC ---
        const today = getStartOfDay(new Date());
        const lastLoginDay = user.lastLogin ? getStartOfDay(user.lastLogin) : null;
        if (lastLoginDay) {
            const diffTime = today.getTime() - lastLoginDay.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) { user.loginStreak = (user.loginStreak || 0) + 1; }
            else if (diffDays > 1) { user.loginStreak = 1; }
        } else { user.loginStreak = 1; }
        user.lastLogin = new Date();
        await user.save();
        
        // --- 2. CHECK FOR ACHIEVEMENTS ---
        // Run in background (no await)
        achievementService.checkLoginStreakAchievements(user);
        // -------------------------------

        const token = generateToken(user._id, user.role);
        res.json({
            success: true, message: 'Login successful', token,
            user: {
                id: user._id, name: user.name, email: user.email, role: user.role,
                isVerified: user.isVerified, avatar: user.avatar,
                twoFactorEnabled: user.twoFactorEnabled,
                loginStreak: user.loginStreak // Send updated streak
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        next(error);
    }
});

// @route   POST /api/auth/google
// @desc    Authenticate user using Google ID Token
// @access  Public
router.post('/google', [
    body('credential').notEmpty().withMessage('Google credential token is required')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { credential } = req.body;
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.sub || !payload.email_verified) {
            return res.status(400).json({ success: false, message: 'Invalid or unverified Google token payload' });
        }
        const { sub: googleId, email, name, picture: avatarUrl } = payload;
        
        let user = await User.findOne({ 'socialLogin.google.id': googleId }).select('+lastLogin +loginStreak +earnedAchievements'); // Select fields

        if (!user) {
            user = await User.findOne({ email: email }).select('+lastLogin +loginStreak +earnedAchievements'); // Select fields
            if (user) {
                // Link account
                if (!user.socialLogin) user.socialLogin = { google: {}, facebook: {} };
                if (!user.socialLogin.google) user.socialLogin.google = {};
                if (!user.socialLogin.google.id) {
                    user.socialLogin.google.id = googleId;
                    user.socialLogin.google.email = email;
                    user.isVerified = true;
                    if (avatarUrl && (!user.avatar || user.avatar.url !== avatarUrl)) { user.avatar = { url: avatarUrl, public_id: null }; }
                } else if (user.socialLogin.google.id !== googleId) {
                    return res.status(400).json({ success: false, message: 'Email already linked to a different Google account.' });
                }
            } else {
                // Create new user
                user = new User({
                    name: name || email.split('@')[0], email: email, role: 'student', isVerified: true,
                    socialLogin: { google: { id: googleId, email: email } },
                    avatar: avatarUrl ? { url: avatarUrl, public_id: null } : undefined,
                    loginStreak: 1 // First login
                });
            }
        }

        // --- LOGIN STREAK LOGIC (Also for Google) ---
        const today = getStartOfDay(new Date());
        const lastLoginDay = user.lastLogin ? getStartOfDay(user.lastLogin) : null;
        if (lastLoginDay) {
            const diffTime = today.getTime() - lastLoginDay.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) { user.loginStreak = (user.loginStreak || 0) + 1; }
            else if (diffDays > 1) { user.loginStreak = 1; }
        } else if (user.isNew) { // Only set to 1 if it's a new user doc
             user.loginStreak = 1;
        }
        user.lastLogin = new Date();
        await user.save();
        
        // --- 2. CHECK FOR ACHIEVEMENTS ---
        achievementService.checkLoginStreakAchievements(user);
        // -------------------------------

        const token = generateToken(user._id, user.role);
        res.status(200).json({
            success: true, message: 'Google login successful', token,
            user: {
                id: user._id, name: user.name, email: user.email, role: user.role,
                isVerified: user.isVerified, avatar: user.avatar,
                twoFactorEnabled: user.twoFactorEnabled,
                loginStreak: user.loginStreak // Send updated streak
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        if (error.message.includes('Token used too late') || error.message.includes('Invalid token signature') || error.message.includes('Wrong recipient')) {
            return res.status(401).json({ success: false, message: 'Invalid or expired Google token.' });
        }
        next(error);
    }
});
// ------------------------------------

// @route   POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
    try {
        const { token } = req.body;
        const user = await User.findOne({ emailVerificationToken: token, emailVerificationExpire: { $gt: Date.now() } });
        if (!user) { return res.status(400).json({ success: false, message: 'Invalid or expired verification token' }); }
        user.isVerified = true; user.emailVerificationToken = undefined; user.emailVerificationExpire = undefined;
        await user.save();
        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) { console.error('Email verification error:', error); next(error); }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', [ body('email').isEmail().normalizeEmail() ], handleValidationErrors, async (req, res, next) => {
    try {
        const { email } = req.body; const user = await User.findOne({ email });
        if (!user) { return res.status(404).json({ success: false, message: 'No user found with this email address' }); }
        const resetToken = user.generatePasswordResetToken(); await user.save();
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        await sendEmail({ email: user.email, subject: 'Password Reset - Edges Africa', template: 'passwordReset', data: { name: user.name, resetUrl } });
        res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) { console.error('Forgot password error:', error); next(error); }
});

// @route   POST /api/auth/reset-password
router.post('/reset-password', [ body('token').exists(), body('password').isLength({ min: 6 }) ], handleValidationErrors, async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } });
        if (!user) { return res.status(400).json({ success: false, message: 'Invalid or expired reset token' }); }
        user.password = password; user.resetPasswordToken = undefined; user.resetPasswordExpire = undefined;
        await user.save();
        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) { console.error('Reset password error:', error); next(error); }
});

// @route   GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found'});
        res.json({ success: true, user });
    } catch (error) { console.error('Get user error:', error); next(error); }
});

// @route   POST /api/auth/setup-2fa
router.post('/setup-2fa', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found'});
        const secret = speakeasy.generateSecret({ name: `Edges Africa (${user.email})`, issuer: 'Edges Africa' });
        user.twoFactorSecret = secret.base32; await user.save();
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        res.json({ success: true, secret: secret.base32, qrCode: qrCodeUrl });
    } catch (error) { console.error('Setup 2FA error:', error); next(error); }
});

// @route   POST /api/auth/verify-2fa
router.post('/verify-2fa', auth, [ body('token').exists() ], handleValidationErrors, async (req, res, next) => {
    try {
        const { token } = req.body; const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found'});
        if (!user.twoFactorSecret) return res.status(400).json({ success: false, message: '2FA not set up'});
        const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 2 });
        if (!verified) { return res.status(400).json({ success: false, message: 'Invalid 2FA token' }); }
        user.twoFactorEnabled = true; await user.save();
        res.json({ success: true, message: 'Two-factor authentication enabled successfully' });
    } catch (error) { console.error('Verify 2FA error:', error); next(error); }
});

// @route   POST /api/auth/disable-2fa
router.post('/disable-2fa', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found'});
        user.twoFactorEnabled = false; user.twoFactorSecret = undefined; await user.save();
        res.json({ success: true, message: 'Two-factor authentication disabled' });
    } catch (error) { console.error('Disable 2FA error:', error); next(error); }
});

module.exports = router;