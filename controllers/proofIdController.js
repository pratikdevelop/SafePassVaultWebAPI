const ProofId = require('../model/proofid'); // Assuming the schema file is named proofId.js
const AuditLog = require('../model/Auditlogs'); // Import the Audit Log model

// Create a new proof ID
exports.createProofId = async (req, res) => {
  try {
    const userId = req.user._id;
    req.body.userId = userId;
    const proofId = new ProofId(req.body);
    await proofId.save();

    // Create an audit log entry for the proof ID creation
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      entity: 'ProofId',
      entityId: proofId._id,
      newValue: proofId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

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

    // Create an audit log entry for retrieving proof IDs
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'ProofId',
      entityId: null, // No specific entity ID for this action
      newValue: proofIds,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ proofIds });
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

    // Create an audit log entry for retrieving a specific proof ID
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'ProofId',
      entityId: proofId._id,
      newValue: proofId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

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

    // Create an audit log entry for the proof ID update
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      entity: 'ProofId',
      entityId: proofId._id,
      oldValue: { ...proofId._doc }, // Store old values
      newValue: proofId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

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

    // Create an audit log entry for the proof ID deletion
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      entity: 'ProofId',
      entityId: proofId._id,
      oldValue: proofId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.send(proofId);
  } catch (error) {
    res.status(500).send(error);
  }
};
