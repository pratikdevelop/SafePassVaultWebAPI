const Card = require('../model/card'); // Assuming the schema file is named card.js

// Create a new card
exports.createCard = async (req, res) => {
  try {
    req.body.userId = req.user._id;
    req.body.expiryDate = new Date()
    const newCard = new Card(req.body);
    await newCard.save();
    res.status(201).send(newCard);
  } catch (error) {
    console.error('rr', error);
    
    res.status(400).send(error);
  }
};

// Get all cards
exports.getAllCards = async (req, res) => {
  try {
    const cards = await Card.find({userId: req.user._id});
    res.send(cards);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get a card by ID
exports.getCardById = async (req, res) => {
  const _id = req.params.id;
  try {
    const card = await Card.findById(_id);
    if (!card) {
      return res.status(404).send();
    }
    res.send(card);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update a card by ID
exports.updateCard = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['cardType', 'cardNumber', 'cardHolderName', 'expiryDate', 'CVV'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).send();
    }

    updates.forEach((update) => card[update] = req.body[update]);
    await card.save();
    res.send(card);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Delete a card by ID
exports.deleteCard = async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) {
      return res.status(404).send();
    }
    res.send(card);
  } catch (error) {
    res.status(500).send(error);
  }
};
