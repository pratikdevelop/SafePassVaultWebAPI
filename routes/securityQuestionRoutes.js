const express = require('express');
const router = express.Router();
const securityQuestionController = require('../controllers/securityQuestionController');

// Add or update security questions
router.post('/', securityQuestionController.addOrUpdateSecurityQuestions);

// Get all security questions for a user
router.get('/', securityQuestionController.getSecurityQuestions);

// Update a security question
router.put('/:id', securityQuestionController.updateSecurityQuestion);

// Delete a security question
router.delete('/:id', securityQuestionController.deleteSecurityQuestion);

module.exports = router;
