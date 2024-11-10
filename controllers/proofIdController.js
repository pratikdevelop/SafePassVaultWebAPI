const ProofId = require('../model/proofid'); // Assuming the schema file is named proofId.js

// Create a new proof ID
exports.createProofId = async (req, res) => {
  try {
    const userId = req.user._id;
    req.body.userId = userId;
    const proofId = new ProofId(req.body);
    await proofId.save();
    res.status(201).send(proofId);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Get all proof IDs
exports.getAllProofIds = async (req, res) => {
  try {
    const proofIds = await ProofId.find({}).populate({
      path: 'userId',
      select: 'name email'
    });
    res.status(200).json({proofIds});
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get a proof ID by ID
exports.getProofIdById = async (req, res) => {
  const _id = req.params.id;
  try {
    const proofId = await ProofId.findById(_id);
    if (!proofId) {
      return res.status(404).send();
    }
    res.send(proofId);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update a proof ID by ID
exports.updateProofId = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['idType', 'idNumber', 'issuedBy', 'issueDate', 'expiryDate'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const proofId = await ProofId.findById(req.params.id);
    if (!proofId) {
      return res.status(404).send();
    }

    updates.forEach((update) => proofId[update] = req.body[update]);
    await proofId.save();
    res.send(proofId);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Delete a proof ID by ID
exports.deleteProofId = async (req, res) => {
  try {
    const proofId = await ProofId.findByIdAndDelete(req.params.id);
    if (!proofId) {
      return res.status(404).send();
    }
    res.send(proofId);
  } catch (error) {
    res.status(500).send(error);
  }
};
