const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Log = mongoose.model('Log', new mongoose.Schema({
    timestamp: Date,
    level: String,
    message: String,
    meta: Object
}));

router.get('/', async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(100); // Get last 100 logs
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
});

module.exports = router;
