const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/confirm-email', userController.confirmEmail);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logout);
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteProfile);
router.post('/reset-password', userController.resetPassword);
router.get('/verify-reset-link', userController.verifyResetLink);
router.post('/organization', userController.createOrganization);
router.post('/organization/:organizationId/invite', userController.sendInvitation);

module.exports = router;
