const Subscription = require('../models/subscription');

// Create a new subscription
exports.createSubscription = async (req, res) => {
  try {
    const subscription = new Subscription(req.body);
    await subscription.save();
    res.status(201).send(subscription);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Get a subscription by ID
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).send({ message: 'Subscription not found' });
    }
    res.status(200).send(subscription);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update a subscription by ID
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subscription) {
      return res.status(404).send({ message: 'Subscription not found' });
    }
    res.status(200).send(subscription);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Delete a subscription by ID
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) {
      return res.status(404).send({ message: 'Subscription not found' });
    }
    res.status(200).send({ message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Import subscriptions from a file (e.g., JSON)
exports.importSubscriptions = async (req, res) => {
  try {
    const subscriptions = req.body; // Assuming JSON array of subscriptions
    await Subscription.insertMany(subscriptions);
    res.status(200).send({ message: 'Subscriptions imported successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Export subscriptions to a file (e.g., JSON)
exports.exportSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
