// In: backend/middleware/upload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');
const path = require('path');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  
  params: async (req, file) => {
    
    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    const isImage = imageMimeTypes.includes(file.mimetype);

    const folder = 'edges-africa-lms';
    const allowed_formats = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'];

    if (isImage) {
      // --- IMAGE LOGIC (Unchanged) ---
      return {
        folder: folder,
        allowed_formats: allowed_formats,
        resource_type: 'image',
        access_mode: 'public',
        transformation: [
          { width: 1280, height: 720, crop: 'limit', quality: 'auto' }
        ]
      };
    } else {
      // --- RAW FILE (PDF/DOC) LOGIC ---
      
      const randomBytes = crypto.randomBytes(16).toString('hex');
      
      // ### THIS IS THE FIX ###
      // We "slugify" the original name to remove spaces, parentheses, etc.
      const originalName = path.parse(file.originalname).name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove all non-alphanumeric chars except hyphens
        .replace(/\s+/g, '-')       // Replace spaces with a hyphen
        .replace(/-+/g, '-');      // Replace multiple hyphens with a single one
      // ### END OF FIX ###

      // This will now be clean, e.g., "timothy-ibitoye-resume-1_...[random]"
      const public_id = `private_assets/${originalName}_${randomBytes}`;
      
      return {
        folder: folder,
        allowed_formats: allowed_formats,
        resource_type: 'raw',
        type: 'private', // Correct parameter for private
        public_id: public_id,   
      };
    }
  }
});

// File filter (No changes needed)
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'];
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed`), false);
  }
};

// Configure multer (No changes needed)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer (No changes needed)
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
  }
  
  if (err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;