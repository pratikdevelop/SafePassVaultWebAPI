const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');

// Get all passwords with pagination, sorting, and searching
router.get('/', passwordController.getAllPasswords);

// Create a new password
router.post('/password', passwordController.createPassword);

// Delete passwords by IDs
router.delete('/password/:ids', passwordController.deletePasswords);

// Update a password by ID
router.put('/password/:id', passwordController.updatePassword);

// Share a password
router.post('/share/:passwordId', passwordController.sharePassword);

// Get a shared password
router.get('/share/:passwordId/:shareToken', passwordController.getSharedPassword);

// Add or remove a password from favorites
router.post('/password/:passwordId/favorite', passwordController.toggleFavorite);

router.get('/export', passwordController.exportAllPasswords);
router.post('/add-tag',  passwordController.addTag)
router.post('/:passwordId/comments', passwordController.postComment)
module.exports = router;
