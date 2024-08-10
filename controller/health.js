const HealthRecord = require('../models/healthRecord');

// Create a new health record
exports.createHealthRecord = async (req, res) => {
  try {
    const healthRecord = new HealthRecord(req.body);
    await healthRecord.save();
    res.status(201).send(healthRecord);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get a health record by ID
exports.getHealthRecord = async (req, res) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id);
    if (!healthRecord) {
      return res.status(404).send({ message: 'HealthRecord not found' });
    }
    res.status(200).send(healthRecord);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update a health record by ID
exports.updateHealthRecord = async (req, res) => {
  try {
    const healthRecord = await HealthRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!healthRecord) {
      return res.status(404).send({ message: 'HealthRecord not found' });
    }
    res.status(200).send(healthRecord);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete a health record by ID
exports.deleteHealthRecord = async (req, res) => {
  try {
    const healthRecord = await HealthRecord.findByIdAndDelete(req.params.id);
    if (!healthRecord) {
      return res.status(404).send({ message: 'HealthRecord not found' });
    }
    res.status(200).send({ message: 'HealthRecord deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import health records from a file (e.g., JSON)
exports.importHealthRecords = async (req, res) => {
  try {
    const healthRecords = req.body; // Assuming JSON array of health records
    await HealthRecord.insertMany(healthRecords);
    res.status(200).send({ message: 'Health records imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export health records to a file (e.g., JSON)
exports.exportHealthRecords = async (req, res) => {
  try {
    const healthRecords = await HealthRecord.find();
    res.status(200).json(healthRecords);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
