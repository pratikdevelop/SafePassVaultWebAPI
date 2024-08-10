const Contact = require('../models/contact');

// Create a new contact
exports.createContact = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).send(contact);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get a contact by ID
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).send({ message: 'Contact not found' });
    }
    res.status(200).send(contact);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update a contact by ID
exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!contact) {
      return res.status(404).send({ message: 'Contact not found' });
    }
    res.status(200).send(contact);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete a contact by ID
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).send({ message: 'Contact not found' });
    }
    res.status(200).send({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import contacts from a file (e.g., JSON)
exports.importContacts = async (req, res) => {
  try {
    const contacts = req.body; // Assuming JSON array of contacts
    await Contact.insertMany(contacts);
    res.status(200).send({ message: 'Contacts imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export contacts to a file (e.g., JSON)
exports.exportContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
