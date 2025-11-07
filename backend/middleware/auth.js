const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  // --- DEBUGGING LOGS START ---
  console.log(`--- Auth Middleware Running for: ${req.method} ${req.originalUrl} ---`);
  // --- DEBUGGING LOGS END ---
  try {
    let token;

    // Check for token in header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      // --- DEBUGGING LOGS START ---
      console.log('Token found in header:', token ? 'Yes' : 'No');
      // --- DEBUGGING LOGS END ---
    } else {
       // --- DEBUGGING LOGS START ---
       console.log('No Authorization header found or header format incorrect.');
       // --- DEBUGGING LOGS END ---
    }


    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // --- DEBUGGING LOGS START ---
      console.log('Token decoded successfully. Decoded payload:', decoded);
      // --- DEBUGGING LOGS END ---

      // Get user from token
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
         // --- DEBUGGING LOGS START ---
         console.log('User not found in database for decoded ID:', decoded.userId);
         // --- DEBUGGING LOGS END ---
        return res.status(401).json({
          success: false,
          message: 'Token is not valid (User not found)', // More specific error
        });
      }

      if (!user.isActive) {
        // --- DEBUGGING LOGS START ---
        console.log('User found but is inactive:', user.email);
        // --- DEBUGGING LOGS END ---
        return res.status(401).json({ // Changed to 401 Unauthorized
          success: false,
          message: 'Account has been deactivated',
        });
      }

      // --- DEBUGGING LOGS START ---
      console.log('User found and active. Attaching req.user:', { userId: user._id, role: user.role, email: user.email, name: user.name, isVerified: user.isVerified });
      // --- DEBUGGING LOGS END ---
      req.user = {
        userId: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      };

      // --- DEBUGGING LOGS START ---
      console.log('Calling next() to proceed from auth middleware.');
      // --- DEBUGGING LOGS END ---
      next(); // Proceed to the next middleware (authorize) or the controller
    } catch (error) {
       // --- DEBUGGING LOGS START ---
       console.log('Error during token verification:', error.name, error.message);
       // --- DEBUGGING LOGS END ---
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
        error: error.name // Send error name (e.g., TokenExpiredError)
      });
    }
  } catch (error) {
     // --- DEBUGGING LOGS START ---
     console.error('Unexpected error in Auth middleware:', error);
     // --- DEBUGGING LOGS END ---
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
  }
};

module.exports = auth;