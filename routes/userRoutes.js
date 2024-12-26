const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account by providing necessary details.
 *     responses:
 *       201:
 *         description: User successfully registered.
 */
router.post("/register", userController.createUser);

/**
 * @swagger
 * /confirm-email:
 *   post:
 *     summary: Confirm user email
 *     description: Confirms the user's email address.
 *     responses:
 *       200:
 *         description: Email successfully confirmed.
 */
router.post("/confirm-email", userController.confirmEmail);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Logs in a user with the provided credentials.
 *     responses:
 *       200:
 *         description: User successfully logged in.
 */
router.post("/login", userController.loginUser);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: User logout
 *     description: Logs out the currently authenticated user.
 *     responses:
 *       200:
 *         description: User successfully logged out.
 */
router.post("/logout", userController.logout);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the profile details of the authenticated user.
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile.
 */
router.get("/profile", userController.getProfile);

/**
 * @swagger
 * /profile:
 *   patch:
 *     summary: Update user profile
 *     description: Update the profile details of the authenticated user.
 *     responses:
 *       200:
 *         description: User profile updated successfully.
 */
router.patch("/profile", userController.updateProfile);

/**
 * @swagger
 * /profile:
 *   delete:
 *     summary: Delete user profile
 *     description: Delete the profile of the authenticated user.
 *     responses:
 *       200:
 *         description: User profile deleted successfully.
 */
router.delete("/profile", userController.deleteProfile);

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset password
 *     description: Sends a reset password email to the user.
 *     responses:
 *       200:
 *         description: Reset password email sent successfully.
 */
router.post("/reset-password", userController.initiateRecovery);

/**
 * @swagger
 * /change-password/{id}:
 *   patch:
 *     summary: Change password
 *     description: Change the password for the user with the given ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password changed successfully.
 */
router.patch("/change-password/:param", userController.changePassword);

/**
 * @swagger
 * /verify-reset-link:
 *   get:
 *     summary: Verify reset link
 *     description: Verifies the reset password link sent to the user.
 *     responses:
 *       200:
 *         description: Reset link verified successfully.
 */
router.get("/verify-reset-link", userController.verifyResetLink);




/**
 * @swagger
 * /mfa-settings:
 *   post:
 *     summary: Save MFA settings
 *     description: Save the multi-factor authentication settings for a user.
 *     responses:
 *       200:
 *         description: MFA settings saved successfully.
 */
router.post("/mfa-settings", userController.saveMfaSettings);

/**
 * @swagger
 * /verify-mfa:
 *   post:
 *     summary: Verify MFA code
 *     description: Verify the multi-factor authentication code provided by the user.
 *     responses:
 *       200:
 *         description: MFA code verified successfully.
 */
router.post("/verify-mfa", userController.verifyMfaCode);

/**
 * @swagger
 * /resend-code/{email}:
 *   get:
 *     summary: Resend confirmation code
 *     description: Resend the confirmation code to the user's email.
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: User's email address.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Confirmation code resent successfully.
 */
router.get("/resend-code/:email", userController.resendConfirmationCode);

// Define the file upload route
router.post("/upload", upload.single("file"), userController.uploadFile);
router.post("/setup-2fa", userController.setUp2FA);
// Route to request a magic link
router.post('/request-magic-link', userController.sendMagicLink);
router.post("/verify-2fa", userController.verify2FA);

// Route to verify magic link when the user clicks the link
router.get('/magic-link', userController.verifyMagicLink);
router.post('/recover-account', userController.initiateRecovery);
router.post('/recovery-verify', userController.verifyRecovery);
router.post('/generate-private-key', userController.addPrivateAndPublicKey);
router.get('/completeWebAuthRegisteration', userController.createWebAuthRegisteration);
router.post('/complete-webauth-register', userController.completeWebAuthRegisteration);
router.post('/webauthn/complete-authenticate', userController.completeWebAuthnAuthentication);
router.post('/verify-security-pin', userController.verifysecurityPin)
module.exports = router;
