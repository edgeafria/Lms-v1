const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth'); // Require authentication
const upload = require('../middleware/upload'); // Require your multer upload middleware

// @route   POST /api/upload
// @desc    Upload a single file with field name 'file'
// @access  Private
router.post(
    '/',
    auth, // 1. Check authentication
    upload.single('file'), // 2. Handle file upload expecting field name 'file'
    uploadController.create // 3. Controller processes result
);

// Other routes return Method Not Allowed via the controller
router.get('/', auth, uploadController.getAll);
router.get('/:id', auth, uploadController.getOne);
router.put('/:id', auth, uploadController.update);
router.delete('/:id', auth, uploadController.remove);

module.exports = router;