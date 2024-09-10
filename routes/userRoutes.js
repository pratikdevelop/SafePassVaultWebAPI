const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get a list of users
 *     description: Retrieve a list of users from the database.
 *     responses:
 *       200:
 *         description: Successful response with a list of users.
 */
router.post('/register', userController.createUser);
router.post('/confirm-email', userController.confirmEmail);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logout);
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteProfile);
router.post('/reset-password', userController.resetPassword);
router.patch('/change-password/:id', userController.changePassword)
router.get('/verify-reset-link', userController.verifyResetLink);
router.post('/organization', userController.createOrganization);
router.get('/organizations', userController.getOrganizations)
router.post('/organizations/:organizationId/invitations', userController.sendInvitation);
router.post('/accept-invitation', userController.acceptInvitation)
router.get('/users', userController.getAllUsers)
router.post('/mfa-settings', userController.saveMfaSettings)
router.post('/verify-mfa', userController.verifyMfaCode)
router.post('/resend-invitation/:organizationId/:recipientId', userController.resendInvitation)
router.get('/resend-code/:email', userController.resendConfirmationCode)
module.exports = router;
