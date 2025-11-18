// In: backend/controllers/assetsController.js
const cloudinary = require('../config/cloudinary');

/**
 * @desc    Get a private asset (PDF, doc) from Cloudinary
 * @route   GET /api/assets
 * @access  Private (Requires user to be logged in)
 */
exports.getAsset = async (req, res, next) => {
  // --- DEBUGGING LOGS ---
  console.log('\n--- [getAsset Controller] ---');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User authenticated:', !!req.user);
  console.log('Raw Query Params:', req.query);
  // --- END DEBUGGING LOGS ---
  
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { id: public_id, name: filename } = req.query;

    // --- DEBUGGING LOGS ---
    console.log('Received public_id:', public_id);
    console.log('Received filename:', filename);
    // --- END DEBUGGING LOGS ---

    if (!public_id) {
      console.log('Error: public_id is missing.');
      return res.status(400).json({ success: false, message: 'File ID is required' });
    }

    // Generate a temporary signed URL for the private file
    const url = cloudinary.utils.url(public_id, {
      resource_type: 'raw',
      sign_url: true,
      type: 'private',
      attachment: filename || true, // Force download
      secure: true
    });

    // --- DEBUGGING LOGS ---
    console.log('Generated Signed URL:', url);
    console.log('--- [Sending URL to frontend] ---');
    // --- END DEBUGGING LOGS ---

    // Send the signed URL back to the frontend
    res.json({ success: true, url: url });

  } catch (error) {
    console.error("Get asset error:", error);
    next(error);
  }
};