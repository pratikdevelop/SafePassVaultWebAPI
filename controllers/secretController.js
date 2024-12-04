const Secret = require('../model/secrets');
const AuditLog = require('../model/Auditlogs'); // Import the Audit Log model

// Create a new secret (e.g., API key, credential)
exports.createSecret = async (req, res) => {
    try {
        const { name, value, type, description } = req.body;

        // Create new secret
        const secret = new Secret({ name, value, type, description });

        // Save to the database
        await secret.save();

        // Create an audit log entry for the secret creation
        await AuditLog.create({
            userId: req.user._id,
            action: 'create',
            entity: 'Secret',
            entityId: secret._id,
            newValue: secret,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({ message: 'Secret stored successfully', secret });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to store secret' });
    }
};

// Retrieve all secrets (decrypted)
exports.getAllSecrets = async (req, res) => {
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

        // Create an audit log entry for retrieving secrets
        await AuditLog.create({
            userId: req.user._id,
            action: 'view',
            entity: 'Secret',
            entityId: null, // No specific entity ID for this action
            newValue: decryptedSecrets,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ decryptedSecrets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve secrets' });
    }
};

// Get a secret by ID
exports.getSecretById = async (req, res) => {
    try {
        const secret = await Secret.findById(req.params.id);
        if (!secret) {
            return res.status(404).json({ error: 'Secret not found' });
        }

        // Create an audit log entry for retrieving a specific secret
        await AuditLog.create({
            userId: req.user._id,
            action: 'view',
            entity: 'Secret',
            entityId: secret._id,
            newValue: secret,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json(secret);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve secret' });
    }
};

// Update a secret by ID
exports.updateSecret = async (req, res) => {
    try {
        const secret = await Secret.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!secret) {
            return res.status(404).json({ error: 'Secret not found' });
        }

        // Create an audit log entry for the secret update
        await AuditLog.create({
            userId: req.user._id,
            action: 'update',
            entity: 'Secret',
            entityId: secret._id,
            oldValue: { ...secret._doc }, // Store old values
            newValue: secret,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json(secret);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to update secret' });
    }
};

// Delete a secret by ID
exports.deleteSecret = async (req, res) => {
    try {
        const secret = await Secret.findByIdAndDelete(req.params.id);
        if (!secret) {
            return res.status(404).json({ error: 'Secret not found' });
        }

        // Create an audit log entry for the secret deletion
        await AuditLog.create({
            userId: req.user._id,
            action: 'delete',
            entity: 'Secret',
            entityId: secret._id,
            oldValue: secret,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ message: 'Secret deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete secret' });
    }
};

// Search for secrets by name
exports.searchSecretsByName = async (req, res) => {
    try {
        const { name } = req.params;
        const secrets = await Secret.find({
            name: { $regex: new RegExp(name, 'i') } // Case-insensitive search
        });

        // Create an audit log entry for the search action
        await AuditLog.create({
            userId: req.user._id,
            action: 'search',
            entity: 'Secret',
            entityId: null, // No specific entity ID for this action
            newValue: secrets,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json(secrets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to search secrets' });
    }
};
