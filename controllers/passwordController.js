const Password = require('../model/password');
const User = require('../model/user');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const mongoose = require('mongoose');

// Get all passwords with pagination, sorting, and searching
exports.getAllPasswords = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = 'name', order = 'asc', search = '' } = req.query;

    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { website: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const passwords = await Password.find({ created_by: userId, ...searchQuery })
      .populate('tags')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const user = await User.findById(userId);

    const enhancedPasswords = passwords.map(password => {
      const isFavorite = user.favorites.includes(password._id);
      return {
        ...password.toObject(),
        isFavorite
      };
    });

    const totalCount = await Password.countDocuments({ created_by: userId, ...searchQuery });

    res.json({
      data: enhancedPasswords,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching passwords" });
  }
};

// Create a new password
exports.createPassword = async (req, res) => {
  try {
    req.body["created_by"] = req.user._id;
    req.body["modifiedby"] = req.user._id;
    req.body["folder"] = req.user._id;

    const newPassword = new Password(req.body);
    const savedPassword = await newPassword.save();
    res.json(savedPassword);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error creating password" });
  }
};

// Delete passwords by IDs
exports.deletePasswords = async (req, res) => {
  try {
    const ids = req.params.ids.split(',');
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    const deletedCount = await Password.deleteMany({ _id: { $in: objectIds } });

    if (deletedCount.deletedCount === 0) {
      res.status(404).json({ message: "No passwords found or deleted" });
    } else {
      res.json({ message: `${deletedCount.deletedCount} passwords deleted` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting passwords" });
  }
};

// Update a password by ID
exports.updatePassword = async (req, res) => {
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
};

// Share a password
exports.sharePassword = async (req, res) => {
  const passwordId = req.params.passwordId;
  const password = await Password.findById(passwordId);

  if (!password) {
    return res.status(404).json({ error: 'Password not found' });
  }
  const shareToken = jwt.sign({ _id: passwordId }, "2lZ2QpWg43");

  const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

  await Password.updateOne({ _id: passwordId }, { shareToken, shareExpiration: expirationDate });

  const shareLink = `http://44.206.224.230/api/passwords/share/${passwordId}/${shareToken}`;
  res.status(200).json({ shareLink });
};

// Get a shared password
exports.getSharedPassword = async (req, res) => {
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
};

// Add or remove a password from favorites
exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const passwordId = req.params.passwordId;

    const password = await Password.findById(passwordId);
    if (!password) {
      return res.status(404).json({ message: 'Password not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const favoriteIndex = user.favorites.indexOf(passwordId);
    if (favoriteIndex > -1) {
      user.favorites.splice(favoriteIndex, 1);
      await user.save();
      return res.status(200).json({ message: 'Password removed from favorites' });
    } else {
      user.favorites.push(passwordId);
      await user.save();
      return res.status(200).json({ message: 'Password added to favorites' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating favorites' });
  }
};
