
const express = require('express');
const { createFolder, getUserFolders, updateFolder, deleteFolder, getFolderById, getFoldersByType } = require('../controllers/folderController');
const router = express.Router();

// Create a new folder
router.post('/', createFolder);

// Get all folders for the logged-in user
router.get('/', getUserFolders);
router.get('/type/:type', getFoldersByType);

// Get a specific folder by ID
router.get('/:id', getFolderById);

// Update a folder
router.put('/:id', updateFolder);

// Delete a folder
router.delete('/:id', deleteFolder);

module.exports = router;
