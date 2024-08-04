const express = require('express');
const ProofId = require('../model/proofid'); // Assuming the schema file is named proofId.js

const router = express.Router();

// Create a new proof ID
router.post('/', async (req, res) => {
    try {
        // const user = User.find
        const proofId = new ProofId(req.body);
        await proofId.save();
        res.status(201).send(proofId);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get all proof IDs
router.get('/', async (req, res) => {
    try {
        const proofIds = await ProofId.find({});
        res.send(proofIds);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get a proof ID by ID
router.get('/:id', async (req, res) => {
    const _id = req.params.id;
    try {
        const proofId = await ProofId.findById(_id);
        if (!proofId) {
            return res.status(404).send();
        }
        res.send(proofId);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update a proof ID by ID
router.patch('/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['idType', 'idNumber', 'issuedBy', 'issueDate', 'expiryDate'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const proofId = await ProofId.findById(req.params.id);
        if (!proofId) {
            return res.status(404).send();
        }

        updates.forEach((update) => proofId[update] = req.body[update]);
        await proofId.save();
        res.send(proofId);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete a proof ID by ID
router.delete('/:id', async (req, res) => {
    try {
        const proofId = await ProofId.findByIdAndDelete(req.params.id);
        if (!proofId) {
            return res.status(404).send();
        }
        res.send(proofId);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
