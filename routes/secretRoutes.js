// routes/secretRoutes.js

const express = require('express');
const Secret = require('../model/secrets');
const router = express.Router();

// Create a new secret (e.g., API key, credential)
router.post('/create', async (req, res) => {
    try {
        const { name, value, type, description } = req.body;

        // Create new secret
        const secret = new Secret({ name, value, type, description });

        // Save to the database
        await secret.save();

        res.status(201).json({ message: 'Secret stored successfully', secret });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to store secret' });
    }
});

// Retrieve all secrets (decrypted)
router.get('/all', async (req, res) => {
    try {
        const secrets = await Secret.find();

        // Decrypt each secret before sending
        const decryptedSecrets = secrets.map(secret => ({
            name: secret.name,
            value: secret.getDecryptedValue(),
            type: secret.type,
            description: secret.description,
            createdAt: secret.createdAt
        }));

        res.status(200).json({ decryptedSecrets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve secrets' });
    }
});

module.exports = router;
