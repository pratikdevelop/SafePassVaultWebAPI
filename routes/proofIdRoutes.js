const express = require('express');
const router = express.Router();
const proofIdController = require('../controllers/proofIdController');

// Create a new proof ID
router.post('/', proofIdController.createProofId);

// Get all proof IDs
router.get('/', proofIdController.getAllProofIds);

// Get a proof ID by ID
router.get('/:id', proofIdController.getProofIdById);

// Update a proof ID by ID
router.patch('/:id', proofIdController.updateProofId);

// Delete a proof ID by ID
router.delete('/:id', proofIdController.deleteProofId);

module.exports = router;
