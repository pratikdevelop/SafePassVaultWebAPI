const Document = require('../models/document');

// Create a new document
exports.createDocument = async (req, res) => {
  try {
    const document = new Document(req.body);
    await document.save();
    res.status(201).send(document);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get a document by ID
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).send({ message: 'Document not found' });
    }
    res.status(200).send(document);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update a document by ID
exports.updateDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!document) {
      return res.status(404).send({ message: 'Document not found' });
    }
    res.status(200).send(document);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete a document by ID
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).send({ message: 'Document not found' });
    }
    res.status(200).send({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import documents from a file (e.g., JSON)
exports.importDocuments = async (req, res) => {
  try {
    const documents = req.body; // Assuming JSON array of documents
    await Document.insertMany(documents);
    res.status(200).send({ message: 'Documents imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export documents to a file (e.g., JSON)
exports.exportDocuments = async (req, res) => {
  try {
    const documents = await Document.find();
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
