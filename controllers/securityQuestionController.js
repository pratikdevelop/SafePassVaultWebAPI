const SecurityQuestion = require('../model/securityQuestion');

// Add or update security questions for a user
exports.addOrUpdateSecurityQuestions = async (req, res) => {
  try {
    const userId = req.user._id;
    let securityQuestions =req.body; // Expecting an array of security questions and answers

    if (!Array.isArray(securityQuestions) || securityQuestions.length === 0) {
      securityQuestions = [
        { question: securityQuestions.securityQuestion1, answer: securityQuestions.securityAnswer1 },
        { question: securityQuestions.securityQuestion2, answer: securityQuestions.securityAnswer2 }
      ];
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
};

// Get all security questions for a user
exports.getSecurityQuestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const questions = await SecurityQuestion.find({ userId: userId });
    res.status(200).json(questions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a security question
exports.updateSecurityQuestion = async (req, res) => {
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
};

// Delete a security question
exports.deleteSecurityQuestion = async (req, res) => {
  try {
    const deletedQuestion = await SecurityQuestion.findByIdAndDelete(req.params.id);
    if (!deletedQuestion) return res.status(404).json({ error: 'Question not found' });
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
