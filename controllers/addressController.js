// controllers/addressController.js
const Address = require('../model/address');

// Create a new address
exports.createAddress = async (req, res) => {
    try {
        req.body['userId'] = req.user._id;
        const address = new Address(req.body);
        await address.save();
        res.status(201).json(address);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all addresses
exports.getAllAddresses = async (req, res) => {
    try {
        const addresses = await Address.find();
        res.status(200).json(addresses);
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
        res.status(200).json(updatedAddress);
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
        res.status(200).json({ message: 'Address deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
