const express = require('express');
const Card = require('../model/card'); // Assuming the schema file is named card.js

const router = express.Router();

// Create a new card
router.post('/', async (req, res) => {
    try {
        const card = new Card(req.body);
        await card.save();
        res.status(201).send(card);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get all cards
router.get('/', async (req, res) => {
    try {
        const cards = await Card.find({});
        res.send(cards);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get a card by ID
router.get('/:id', async (req, res) => {
    const _id = req.params.id;
    try {
        const card = await Card.findById(_id);
        if (!card) {
            return res.status(404).send();
        }
        res.send(card);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update a card by ID
router.patch('/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['cardType', 'cardNumber', 'cardHolderName', 'expiryDate', 'CVV'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const card = await Card.findById(req.params.id);
        if (!card) {
            return res.status(404).send();
        }

        updates.forEach((update) => card[update] = req.body[update]);
        await card.save();
        res.send(card);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete a card by ID
router.delete('/:id', async (req, res) => {
    try {
        const card = await Card.findByIdAndDelete(req.params.id);
        if (!card) {
            return res.status(404).send();
        }
        res.send(card);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
