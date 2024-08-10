const Insurance = require('../models/insurance');

// Create a new insurance record
exports.createInsurance = async (req, res) => {
  try {
    const insurance = new Insurance(req.body);
    await insurance.save();
    res.status(201).send(insurance);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get an insurance record by ID
exports.getInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);
    if (!insurance) {
      return res.status(404).send({ message: 'Insurance not found' });
    }
    res.status(200).send(insurance);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update an insurance record by ID
exports.updateInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!insurance) {
      return res.status(404).send({ message: 'Insurance not found' });
    }
    res.status(200).send(insurance);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete an insurance record by ID
exports.deleteInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findByIdAndDelete(req.params.id);
    if (!insurance) {
      return res.status(404).send({ message: 'Insurance not found' });
    }
    res.status(200).send({ message: 'Insurance deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import insurance records from a file (e.g., JSON)
exports.importInsurances = async (req, res) => {
  try {
    const insurances = req.body; // Assuming JSON array of insurance records
    await Insurance.insertMany(insurances);
    res.status(200).send({ message: 'Insurance records imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export insurance records to a file (e.g., JSON)
exports.exportInsurances = async (req, res) => {
  try {
    const insurances = await Insurance.find();
    res.status(200).json(insurances);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
