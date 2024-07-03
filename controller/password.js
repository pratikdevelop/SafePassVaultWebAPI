const express = require("express");
const router = express.Router();
const Password = require("../model/password");
const jwt = require('jsonwebtoken');
var CryptoJS = require("crypto-js");

router.get("/", async (req, res) => {
  try {
    const passwords = await Password.find({userId:req.user._id});
    res.json(passwords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching passwords" });
  }
});

router.post("/password", async (req, res) => {
  try {
    req.body["userId"] = req.user._id;

    const newPassword = new Password(req.body);
    const savedPassword = await newPassword.save();
    res.json(savedPassword);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error creating password" });
  }
});

router.delete("/password/:id", async (req, res) => {
  try {
    const deletedPassword = await Password.findByIdAndDelete(req.params.id);
    if (!deletedPassword) {
      res.status(404).json({ message: "Password not found" });
    } else {
      res.json(deletedPassword);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting password" });
  }
});
router.put("/password/:id", async (req, res) => {
  try {
    const updatedPassword = await Password.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPassword) {
      res.status(404).json({ message: "Password not found" });
    } else {
      res.json(updatedPassword);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating password" });
  }
});

router.post('/share/:passwordId', async (req, res) => {
  const passwordId = req.params.passwordId;
  const password = await Password.findById(passwordId); // Fetch password from database

  if (!password) {
    return res.status(404).json({ error: 'Password not found' });
  }
  const shareToken = jwt.sign({ _id: passwordId }, "2lZ2QpWg43");

  const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

  // Store the share token and expiration date in your database
  await Password.updateOne({ _id: passwordId }, { shareToken, shareExpiration: expirationDate });

  // Send the share link to the user
  const shareLink = `http://44.206.224.230/api/passwords/share/${passwordId}/${shareToken}`;
  res.statusCode(200).json({ shareLink });
});

router.get('/share/:passwordId/:shareToken', async (req, res) => {
  const passwordId = req.params.passwordId;
  const shareToken = req.params.shareToken;

  const password = await Password.findById(passwordId);
  if (!password || password.shareToken !== shareToken || new Date() > password.shareExpiration) {
    return res.status(400).json({ error: 'Invalid share link or expired' });
  }

  const decryptedPassword = CryptoJS.AES.decrypt(
    password.password,
    password.key
  );
  res.json({ password: decryptedPassword.toString(CryptoJS.enc.Utf8) });
});

module.exports = router;
