const express = require('express');
const secretController = require('../controllers/secretController'); // Import the new controller
const router = express.Router();

// Create a new secret
router.post('/create', secretController.createSecret);

// Retrieve all secrets (decrypted)
router.get('/all', secretController.getAllSecrets);

// Get a secret by ID
router.get('/:id', secretController.getSecretById);

// Update a secret by ID
router.put('/:id', secretController.updateSecret);

// Delete a secret by ID
router.delete('/:id', secretController.deleteSecret);

// Search for secrets by name
router.get('/search/:name', secretController.searchSecretsByName);

module.exports = router;