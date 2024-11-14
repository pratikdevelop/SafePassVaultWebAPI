const express = require('express');
const router = express.Router();
const fileController = require('../controllers/filecontroller');
const multer = require('multer');
// Setup multer for file upload handling
const storage = multer.diskStorage({
    storage: multer.memoryStorage(),

    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});


const upload = multer({ storage: storage });
// Route to upload a file
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Route to get a file by ID
router.get('/preview/:id', fileController.getFileById);

router.get('/', fileController.getAllFiles);

// Route to update file metadata
router.put('/:id', fileController.updateFile);

// Route to soft delete a file
router.delete('/:id', fileController.deleteFile);

// Route to restore a soft-deleted file
router.patch('/:id/restore', fileController.restoreFile);

// Route to permanently delete a file
router.delete('/file/:id', fileController.permanentlyDeleteFile);

router.post('/folder', fileController.createFolder);
router.get('/searchUsers/:searchTerm', fileController.searchUsers)


module.exports = router;
