const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

// Create a new card
router.post('/', cardController.createCard);

// Get all cards
router.get('/', cardController.getAllCards);

// Get a card by ID
router.get('/:id', cardController.getCardById);

// Update a card by ID
router.patch('/:id', cardController.updateCard);

// Delete a card by ID
router.delete('/:id', cardController.deleteCard);

module.exports = router;
