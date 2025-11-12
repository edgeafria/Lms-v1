// In: backend/controllers/uploadController.js
const { validationResult } = require('express-validator');

// @desc    Handle generic single file upload
// @route   POST /v1/upload
// @access  Private (Requires authentication)
exports.create = async (req, res, next) => { // Maps to POST /
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded or incorrect field name used (expected: \'file\').' });
        }

        // ### THIS IS THE FIX ###
        // Manually determine the resource_type based on the mimetype
        let resource_type;
        if (req.file.mimetype.startsWith('image/')) {
            resource_type = 'image';
        } else if (req.file.mimetype.startsWith('video/')) {
            resource_type = 'video';
        } else {
            // Treat everything else (pdf, doc, etc.) as 'raw'
            resource_type = 'raw';
        }
        // ### END OF FIX ###

        // Return the details provided by Cloudinary via the middleware
        res.status(200).json({ // Use 200 OK for successful upload returning data
            success: true,
            message: 'File uploaded successfully',
            data: {
                // Details from multer-storage-cloudinary
                url: req.file.path, // secure_url
                public_id: req.file.filename, // public_id
                format: req.file.format,
                
                // Now we send our manually-defined resource_type
                resource_type: resource_type, 
                
                size: req.file.size, // in bytes
                original_filename: req.file.originalname
            }
        });

    } catch (error) {
        console.error("Generic Upload Controller Error:", error);
        next(error);
    }
};

// --- Other functions return 'Not Supported' messages ---

exports.getAll = (req, res, next) => {
    res.status(405).json({ success: false, message: 'Method Not Allowed: Cannot GET /v1/upload' });
};

exports.getOne = (req, res, next) => {
     res.status(405).json({ success: false, message: 'Method Not Allowed: Cannot GET /v1/upload/:id' });
};

exports.update = (req, res, next) => {
     res.status(405).json({ success: false, message: 'Method Not Allowed: Cannot PUT /v1/upload/:id' });
};

exports.remove = (req, res, next) => {
     // Optional: Implement logic to delete from Cloudinary using public_id if needed, requires Admin role?
     res.status(405).json({ success: false, message: 'Method Not Allowed: Cannot DELETE /v1/upload/:id (Deletion logic not implemented)' });
};