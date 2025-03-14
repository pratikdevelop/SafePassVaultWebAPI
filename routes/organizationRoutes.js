const express = require("express");
const router = express.Router();
const organizationController = require('../controllers/Organization')


/**
 * @swagger
 * /organization:
 *   post:
 *     summary: Create organization
 *     description: Creates a new organization.
 *     responses:
 *       201:
 *         description: Organization created successfully.
 */
router.post("/organization", organizationController.createOrganization);
router.delete('/organization/:id', organizationController.deleteOrganization)
/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get organizations
 *     description: Retrieve a list of organizations.
 *     responses:
 *       200:
 *         description: Successfully retrieved list of organizations.
 */
router.get("/organizations", organizationController.getOrganizations);
router.get('/organization/:id', organizationController.getOrganizationBYId);
router.put('/organization/:id', organizationController.updateOrganization)

module.exports = router;