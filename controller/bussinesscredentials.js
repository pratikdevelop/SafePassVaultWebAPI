const BusinessCredentials = require('../models/businessCredentials');

// Create new business credentials
exports.createBusinessCredentials = async (req, res) => {
  try {
    const businessCredentials = new BusinessCredentials(req.body);
    await businessCredentials.save();
    res.status(201).send(businessCredentials);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get business credentials by ID
exports.getBusinessCredentials = async (req, res) => {
  try {
    const businessCredentials = await BusinessCredentials.findById(req.params.id);
    if (!businessCredentials) {
      return res.status(404).send({ message: 'Business credentials not found' });
    }
    res.status(200).send(businessCredentials);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update business credentials by ID
exports.updateBusinessCredentials = async (req, res) => {
  try {
    const businessCredentials = await BusinessCredentials.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!businessCredentials) {
      return res.status(404).send({ message: 'Business credentials not found' });
    }
    res.status(200).send(businessCredentials);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete business credentials by ID
exports.deleteBusinessCredentials = async (req, res) => {
  try {
    const businessCredentials = await BusinessCredentials.findByIdAndDelete(req.params.id);
    if (!businessCredentials) {
      return res.status(404).send({ message: 'Business credentials not found' });
    }
    res.status(200).send({ message: 'Business credentials deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import business credentials from a file (e.g., JSON)
exports.importBusinessCredentials = async (req, res) => {
  try {
    const businessCredentials = req.body; // Assuming JSON array of business credentials
    await BusinessCredentials.insertMany(businessCredentials);
    res.status(200).send({ message: 'Business credentials imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export business credentials to a file (e.g., JSON)
exports.exportBusinessCredentials = async (req, res) => {
  try {
    const businessCredentials = await BusinessCredentials.find();
    res.status(200).json(businessCredentials);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
