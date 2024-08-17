const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const multer = require('multer');

// Setup multer for file upload handling
const upload = multer({ dest: 'uploads/' });

// Route to upload a file
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Route to get a file by ID
router.get('/:id', fileController.getFileById);

router.get('/', fileController.getAllFiles);

// Route to update file metadata
router.put('/:id', fileController.updateFile);

// Route to soft delete a file
router.delete('/:id', fileController.deleteFile);

// Route to restore a soft-deleted file
router.patch('/:id/restore', fileController.restoreFile);

// Route to permanently delete a file
router.delete('/:id/permanently', fileController.permanentlyDeleteFile);

module.exports = router;
