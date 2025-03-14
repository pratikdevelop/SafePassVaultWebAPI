// routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// Define routes
router.post('/', addressController.createAddress);       // Create new address
router.get('/', addressController.getAllAddresses);     // Get all addresses
router.get('/:id', addressController.getAddressById);   // Get single address by ID
router.put('/:id', addressController.updateAddress);    // Update address by ID
router.delete('/:id', addressController.deleteAddress); // Delete address by ID

module.exports = router;
