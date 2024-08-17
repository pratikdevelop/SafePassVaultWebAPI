const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

// Create a new tag
router.post('/tag', tagController.createTag);

// Get all tags
router.get('/', tagController.getAllTags);

// Get a specific tag
router.get('/:id', tagController.getTagById);

// Update a tag
router.put('/:id', tagController.updateTag);

// Delete a tag
router.delete('/:id', tagController.deleteTag);

// Search for tags by name
router.get('/search/:name', tagController.searchTagsByName);

module.exports = router;
