const express = require('express');
const router = express.Router();
const SecurityQuestion = require('../model/securityQuestion');

// Add or update security questions for a user
router.post('/', async (req, res) => {
  try {
    const  userId = req.user._id;
    const securityQuestions = req.body; // Expecting an array of security questions and answers

    console.log('ff',  securityQuestions)
    if (!Array.isArray(securityQuestions) || securityQuestions.length === 0) {
      return res.status(400).json({ error: 'Invalid securityQuestions array' });
    }

    // Create or update the document
    const updatedDocument = await SecurityQuestion.findOneAndUpdate(
      { userId: userId },
      { $set: { securityQuestions, updatedAt: Date.now() } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(updatedDocument);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all security questions for a user
router.get('', async (req, res) => {

  try {
    const userId = req.user._id
    const questions = await SecurityQuestion.find({ userId:userId });
    res.status(200).json(questions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a security question
router.put('/:id', async (req, res) => {
  try {
    const { question, answer } = req.body;
    const updatedQuestion = await SecurityQuestion.findByIdAndUpdate(
      req.params.id,
      { question, answer, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedQuestion) return res.status(404).json({ error: 'Question not found' });
    res.status(200).json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a security question
router.delete('/:id', async (req, res) => {
  try {
    const deletedQuestion = await SecurityQuestion.findByIdAndDelete(req.params.id);
    if (!deletedQuestion) return res.status(404).json({ error: 'Question not found' });
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
