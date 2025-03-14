const Address = require('../model/address');
const AuditLog = require('../model/Auditlogs'); // Import the Audit Log model

// Create a new address
exports.createAddress = async (req, res) => {
    try {
        req.body['userId'] = req.user._id;
        const address = new Address(req.body);
        await address.save();

        // Create an audit log entry for the address creation
        await AuditLog.create({
            userId: req.user._id,
            action: 'create',
            entity: 'Address',
            entityId: address._id,
            newValue: address,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json(address);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all addresses
exports.getAllAddresses = async (req, res) => {
    try {
        const addresses = await Address.find();

        // Create an audit log entry for retrieving addresses
        await AuditLog.create({
            userId: req.user._id,
            action: 'view',
            entity: 'Address',
            entityId: null, // No specific entity ID for this action
            newValue: addresses,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ addresses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single address by ID
exports.getAddressById = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Create an audit log entry for retrieving a specific address
        await AuditLog.create({
            userId: req.user._id,
            action: 'view',
            entity: 'Address',
            entityId: address._id,
            newValue: address,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json(address);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an address by ID
exports.updateAddress = async (req, res) => {
    try {
        const updatedAddress = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Create an audit log entry for the address update
        await AuditLog.create({
            userId: req.user._id,
            action: 'update',
            entity: 'Address',
            entityId: updatedAddress._id,
            oldValue: { ...updatedAddress._doc }, // Store old values
            newValue: updatedAddress,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ address: updatedAddress });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete an address by ID
exports.deleteAddress = async (req, res) => {
    try {
        const deletedAddress = await Address.findByIdAndDelete(req.params.id);
        if (!deletedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Create an audit log entry for the address deletion
        await AuditLog.create({
            userId: req.user._id,
            action: 'delete',
            entity: 'Address',
            entityId: deletedAddress._id,
            oldValue: deletedAddress,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
