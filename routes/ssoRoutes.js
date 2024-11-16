const express = require('express');
const router = express.Router();
const ssoController = require('../controllers/ssoSettingsController');

// Create a new tag
router.post('/', ssoController.saveSSOSettings);

// Get all tags
router.get('/', ssoController.getAllSSoSettings);

// Get a specific tag
router.get('/:provider', ssoController.getAllSSOSettingsByProvider);


// Delete a tag
router.delete('/:provider', ssoController.deletedSettings);


module.exports = router;
