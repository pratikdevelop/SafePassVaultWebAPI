
const note = require('../model/note'); // Assuming the schema file is named note.js
const User = require('../model/user')
const express = require('express');
const router = express.Router();

// Create a new note card
router.post('/note', async (req, res) => {
    try {
        req.body.userId=req.user._id;
        const newnote = new note(req.body);
        await newnote.save();
        res.status(201).send(newnote);
    } catch (error) {
        console.error("err", error)
        res.status(400).send(error);
    }
});

// Get all note cards
router.get('/', async (req, res) => {
    try {
        // Find notes based on userId if provided
        let notes = await note.find({});

        // Fetch and add owner name to each note
        let updateNotes = await Promise.all(notes.map(async (note) => {
            const user = await User.findById(note.userId);
            note = note.toObject();
            note.ownerName = user ? user.name : 'Unknown';
            return note;
        }));

        res.send(updateNotes);
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
    const allowedUpdates = ['title', 'content', 'tags', 'userId']; // Include 'userId' if the owner can be changed
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const noteInfo = await note.findById(req.params.id);
        if (!noteInfo) {
            return res.status(404).send({ error: 'Note not found!' });
        }

        updates.forEach((update) => noteInfo[update] = req.body[update]);

        if (updates.includes('userId')) {
            const user = await User.findById(noteInfo.userId);
            noteInfo.ownerName = user ? user.name : 'Unknown';
        }

        await noteInfo.save();

        console.log('Updated note:', noteInfo);
        res.send(noteInfo);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(400).send({ error: 'Error updating note!' });
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
