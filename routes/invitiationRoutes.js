const express = require("express");
const router = express.Router();
const InvitationController = require('../controllers/InvitationController')
/**
 * @swagger
 * /organizations/{organizationId}/invitations:
 *   post:
 *     summary: Send invitation
 *     description: Sends an invitation to a user to join an organization.
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         description: ID of the organization.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation sent successfully.
 */
router.post(
    "/:organizationId/invitations",
    InvitationController.sendInvitation
);

/**
 * @swagger
 * /accept-invitation:
 *   post:
 *     summary: Accept invitation
 *     description: Accepts an invitation to join an organization.
 *     responses:
 *       200:
 *         description: Invitation accepted successfully.
 */
router.post("/accept-invitation", InvitationController.acceptInvitation);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users in the system.
 *     responses:
 *       200:
 *         description: Successfully retrieved list of users.
 */
router.get("/users", InvitationController.getAllUsers);


/**
 * @swagger
 * /resend-invitation/{organizationId}/{recipientId}:
 *   post:
 *     summary: Resend invitation
 *     description: Resend an invitation to join an organization.
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         description: ID of the organization.
 *         schema:
 *           type: string
 *       - in: path
 *         name: recipientId
 *         required: true
 *         description: ID of the recipient.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation resent successfully.
 */
router.post(
    "/resend-invitation/:organizationId/:recipientId",
    InvitationController.resendInvitation
    // resendInvitation
); module.exports = router;