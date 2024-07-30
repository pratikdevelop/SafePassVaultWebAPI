
const note = require('../model/note'); // Assuming the schema file is named note.js
const express = require('express');
const router = express.Router();

// Create a new note card
router.post('/note', async (req, res) => {
    try {
        const note = new note(req.body);
        await note.save();
        res.status(201).send(note);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get all note cards
router.get('/', async (req, res) => {
    try {
        const notes = await note.find({});
        res.send(notes);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get a note card by ID
router.get('/:id', async (req, res) => {
    const _id = req.params.id;
    try {
        const note = await note.findById(_id);
        if (!note) {
            return res.status(404).send();
        }
        res.send(note);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update a note card by ID
router.patch('/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'content', 'tags'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const note = await note.findById(req.params.id);
        if (!note) {
            return res.status(404).send();
        }

        updates.forEach((update) => note[update] = req.body[update]);
        await note.save();
        res.send(note);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete a note card by ID
router.delete('/:id', async (req, res) => {
    try {
        const note = await note.findByIdAndDelete(req.params.id);
        if (!note) {
            return res.status(404).send();
        }
        res.send(note);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
