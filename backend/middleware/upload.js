const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');
const path = require('path');

// ... (console.log debugs) ...
console.log("--- [DEBUG] backend/middleware/upload.js ---");
console.log("Is 'cloudinary' object valid?", !!cloudinary.config().cloud_name);
console.log("------------------------------------------");


// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  
  params: async (req, file) => {
    
    // 🐞 --- MOVED HELPER LOGIC TO THE TOP --- 🐞
    // Now both 'if' and 'else' blocks can use this
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const originalName = path.parse(file.originalname).name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove all non-alphanumeric chars except hyphens
      .replace(/\s+/g, '-')       // Replace spaces with a hyphen
      .replace(/-+/g, '-');      // Replace multiple hyphens with a single one

    // ... (Debug logs) ...
    console.log("--- [DEBUG] CloudinaryStorage PARAMS function executing ---");
    console.log("File mimetype:", file.mimetype);
    console.log("File originalname:", file.originalname);

    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    const isImage = imageMimeTypes.includes(file.mimetype);

    const folder = 'edges-africa-lms';
    const allowed_formats = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'];

    if (isImage) {
      // --- IMAGE LOGIC ---
      console.log("[DEBUG] File is an IMAGE. Using 'image' resource_type.");

      // 🐞 --- THIS IS THE FIX --- 🐞
      // We now generate a public_id for images too
      const public_id = `images/${originalName}_${randomBytes}`;
      console.log("[DEBUG] Generated public_id for image:", public_id);
      
      return {
        folder: folder,
        allowed_formats: allowed_formats,
        resource_type: 'image',
        access_mode: 'public',
        public_id: public_id, // <-- THE ADDED LINE
        transformation: [
          { width: 1280, height: 720, crop: 'limit', quality: 'auto' }
        ]
      };
    } else {
      // --- RAW FILE (PDF/DOC) LOGIC ---
      console.log("[DEBUG] File is NOT an image. Using 'raw' resource_type.");

      const public_id = `private_assets/${originalName}_${randomBytes}`;
      
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

// ... (fileFilter and multer config are unchanged) ...
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'];
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB default
  },
  fileFilter: fileFilter
});


// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  
  console.log("--- [DEBUG] handleMulterError MIDDLEWARE ---");
  console.error(err);
  console.log("------------------------------------------");
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      // This is what the user is seeing, even though the real error is nested
      
      // 🐞 --- Let's check for the nested error --- 🐞
      if (err.storageErrors && Array.isArray(err.storageErrors) && err.storageErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: err.storageErrors[0].message // Send the *real* error
        });
      }
      // ---
      
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

  if (err) {
    console.log("[DEBUG] Error was not a MulterError. Sending 400.");
    let errorMessage = "File upload failed. Please check server logs.";
    if (err.storageErrors && Array.isArray(err.storageErrors) && err.storageErrors.length > 0) {
      errorMessage = err.storageErrors[0].message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
  
  next(err);
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;