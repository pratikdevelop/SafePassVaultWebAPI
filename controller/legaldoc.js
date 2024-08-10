const LegalDoc = require('../models/legalDoc');

// Create a new legal document
exports.createLegalDoc = async (req, res) => {
  try {
    const legalDoc = new LegalDoc(req.body);
    await legalDoc.save();
    res.status(201).send(legalDoc);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get a legal document by ID
exports.getLegalDoc = async (req, res) => {
  try {
    const legalDoc = await LegalDoc.findById(req.params.id);
    if (!legalDoc) {
      return res.status(404).send({ message: 'Legal document not found' });
    }
    res.status(200).send(legalDoc);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update a legal document by ID
exports.updateLegalDoc = async (req, res) => {
  try {
    const legalDoc = await LegalDoc.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!legalDoc) {
      return res.status(404).send({ message: 'Legal document not found' });
    }
    res.status(200).send(legalDoc);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete a legal document by ID
exports.deleteLegalDoc = async (req, res) => {
  try {
    const legalDoc = await LegalDoc.findByIdAndDelete(req.params.id);
    if (!legalDoc) {
      return res.status(404).send({ message: 'Legal document not found' });
    }
    res.status(200).send({ message: 'Legal document deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import legal documents from a file (e.g., JSON)
exports.importLegalDocs = async (req, res) => {
  try {
    const legalDocs = req.body; // Assuming JSON array of legal documents
    await LegalDoc.insertMany(legalDocs);
    res.status(200).send({ message: 'Legal documents imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export legal documents to a file (e.g., JSON)
exports.exportLegalDocs = async (req, res) => {
  try {
    const legalDocs = await LegalDoc.find();
    res.status(200).json(legalDocs);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
