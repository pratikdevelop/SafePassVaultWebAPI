const express = require('express');
const router = express.Router();
const Tag = require('../model/passwordtag'); // Import your Tag model

// Create a new tag
router.post('/tag', async (req, res) => {
    try {
        const tag = new Tag(req.body);
        await tag.save();
        res.status(201).json(tag);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all tags
router.get('/', async (req, res) => {
    try {
        const tags = await Tag.find();
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific tag
router.get('/:id', async (req, res) => {
    try {
        const tag = await Tag.findById(req.params.id);
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.json(tag);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a tag
router.put('/:id', async (req, res) => {
    try {
        const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.json(tag);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a tag
router.delete('/:id', async (req, res) => {
    try {
        const tag = await Tag.findByIdAndDelete(req.params.id);
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/search/:name', async (req, res) => {
    try {
        const { name } = req.params;

        // Create a text index if it doesn't exist

        const tags = await Tag.find({ name: { $regex: new RegExp(name, 'i') } });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
