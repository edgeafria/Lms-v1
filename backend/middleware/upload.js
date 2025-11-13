const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');
const path = require('path');

// 🐞 --- ADDED LOG --- 🐞
console.log("--- [DEBUG] backend/middleware/upload.js ---");
console.log("Is 'cloudinary' object valid?", !!cloudinary.config().cloud_name);
console.log("------------------------------------------");

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  
  params: async (req, file) => {
    
    // 🐞 --- START DEBUG LOGS --- 🐞
    console.log("--- [DEBUG] CloudinaryStorage PARAMS function executing ---");
    console.log("File mimetype:", file.mimetype);
    console.log("File originalname:", file.originalname);
    // 🐞 --- END DEBUG LOGS --- 🐞

    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    const isImage = imageMimeTypes.includes(file.mimetype);

    const folder = 'edges-africa-lms';
    const allowed_formats = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'];

    if (isImage) {
      // --- IMAGE LOGIC (Unchanged) ---
      // 🐞 --- ADDED LOG --- 🐞
      console.log("[DEBUG] File is an IMAGE. Using 'image' resource_type.");
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
      // 🐞 --- ADDED LOG --- 🐞
      console.log("[DEBUG] File is NOT an image. Using 'raw' resource_type.");

      const randomBytes = crypto.randomBytes(16).toString('hex');
      
      const originalName = path.parse(file.originalname).name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove all non-alphanumeric chars except hyphens
        .replace(/\s+/g, '-')       // Replace spaces with a hyphen
        .replace(/-+/g, '-');      // Replace multiple hyphens with a single one

      const public_id = `private_assets/${originalName}_${randomBytes}`;
      
      // 🐞 --- ADDED LOG --- 🐞
      console.log("[DEBUG] Generated public_id:", public_id);
      return {
        folder: folder,
        allowed_formats: allowed_formats,
        resource_type: 'raw',
        type: 'private',
        public_id: public_id,   
      };
    }
  }
});

// File filter (No changes needed)
const fileFilter = (req, file, cb) => {
  // ... (unchanged)
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'];
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  
  // 🐞 --- ADDED LOG --- 🐞
  console.log("--- [DEBUG] handleMulterError MIDDLEWARE ---");
  console.error(err);
  console.log("------------------------------------------");
  
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
  
  if (err && err.message && err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // 🐞 --- ADDED GENERIC CLOUDINARY ERROR CATCH --- 🐞
  // This is what is likely happening. 'err' is not a MulterError,
  // but a direct error from Cloudinary (like "Invalid API Key")
  if (err) {
    console.log("[DEBUG] Error was not a MulterError. Sending 400.");
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed. Please check server logs."
    });
  }
  // 🐞 --- END OF FIX ---
  
  next(err);
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;