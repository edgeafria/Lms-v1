const authorize = (roles) => {
  return (req, res, next) => {
    // --- DEBUGGING LOGS START ---
    console.log('--- Inside Authorize Middleware ---');
    if (!req.user) {
      console.log('Authorize check failed: req.user is missing. Auth middleware might have failed or wasn\'t run first.');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
      });
    }
    console.log('Roles allowed:', roles);
    console.log('User role from req.user:', req.user.role);
    console.log('Is user role included in allowed roles?', roles.includes(req.user.role));
    console.log('-----------------------------------');
    // --- DEBUGGING LOGS END ---

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized for this action.`,
      });
    }

    // If the role check passes, move to the next function (the controller)
    next();
  };
};

module.exports = authorize;