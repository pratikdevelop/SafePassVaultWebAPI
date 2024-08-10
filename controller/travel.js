const Travel = require('../models/travel');

// Create a new travel record
exports.createTravel = async (req, res) => {
  try {
    const travel = new Travel(req.body);
    await travel.save();
    res.status(201).send(travel);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get a travel record by ID
exports.getTravel = async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id);
    if (!travel) {
      return res.status(404).send({ message: 'Travel not found' });
    }
    res.status(200).send(travel);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update a travel record by ID
exports.updateTravel = async (req, res) => {
  try {
    const travel = await Travel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!travel) {
      return res.status(404).send({ message: 'Travel not found' });
    }
    res.status(200).send(travel);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete a travel record by ID
exports.deleteTravel = async (req, res) => {
  try {
    const travel = await Travel.findByIdAndDelete(req.params.id);
    if (!travel) {
      return res.status(404).send({ message: 'Travel not found' });
    }
    res.status(200).send({ message: 'Travel deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import travel records from a file (e.g., JSON)
exports.importTravels = async (req, res) => {
  try {
    const travels = req.body; // Assuming JSON array of travel records
    await Travel.insertMany(travels);
    res.status(200).send({ message: 'Travel records imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export travel records to a file (e.g., JSON)
exports.exportTravels = async (req, res) => {
  try {
    const travels = await Travel.find();
    res.status(200).json(travels);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
