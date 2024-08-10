const Financial = require('../models/financial');

// Create a new financial record
exports.createFinancial = async (req, res) => {
  try {
    const financial = new Financial(req.body);
    await financial.save();
    res.status(201).send(financial);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get a financial record by ID
exports.getFinancial = async (req, res) => {
  try {
    const financial = await Financial.findById(req.params.id);
    if (!financial) {
      return res.status(404).send({ message: 'Financial not found' });
    }
    res.status(200).send(financial);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update a financial record by ID
exports.updateFinancial = async (req, res) => {
  try {
    const financial = await Financial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!financial) {
      return res.status(404).send({ message: 'Financial not found' });
    }
    res.status(200).send(financial);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete a financial record by ID
exports.deleteFinancial = async (req, res) => {
  try {
    const financial = await Financial.findByIdAndDelete(req.params.id);
    if (!financial) {
      return res.status(404).send({ message: 'Financial not found' });
    }
    res.status(200).send({ message: 'Financial deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import financial records from a file (e.g., JSON)
exports.importFinancials = async (req, res) => {
  try {
    const financials = req.body; // Assuming JSON array of financial records
    await Financial.insertMany(financials);
    res.status(200).send({ message: 'Financial records imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export financial records to a file (e.g., JSON)
exports.exportFinancials = async (req, res) => {
  try {
    const financials = await Financial.find();
    res.status(200).json(financials);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
