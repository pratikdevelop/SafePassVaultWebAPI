const Password = require('../model/password');
const User = require('../model/user');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const mongoose = require('mongoose');
const SharedItem = require('../model/shareItem'); // Assuming this is your SharedItem model
const { parse } = require('json2csv');
const Tag = require('../model/tag')
const Comment = require('../model/comment')


// Get all passwords with pagination, sorting, and searching
exports.getAllPasswords = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = 'name', order = 'asc', search } = req.query;
    console.log('dd', search);
    

    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const searchQuery = search !== 'undefined'
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { website: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    console.log('searchW', searchQuery);
    
    // Find passwords created by the user and populate 'created_by' and 'modifiedby' fields
    const createdPasswords = await Password.find({ created_by: userId, ...searchQuery })
      .populate('tags')
      .populate({
        path: 'comments',
        populate: {
          path: 'createdBy',
          select: 'name', // Populate the 'name' field of the user who created the comment
        }
      })
      .populate({
        path: 'created_by',
        select: 'name', // Populate the 'name' field of the user who created the password
      })
      .populate({
        path: 'modifiedby',
        select: 'name', // Populate the 'name' field of the user who modified the password
      })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Find passwords shared with the user
    const sharedItems = await SharedItem.find({ 
      itemType: 'password', 
      'sharedWith.userId': userId 
    }).populate('itemId');

    const sharedPasswordIds = sharedItems.map(item => item.itemId);

    // Find and populate shared passwords
    const sharedPasswords = await Password.find({ 
      _id: { $in: sharedPasswordIds }, 
      ...searchQuery 
    })
    .populate('tags')
    .populate({
      path: 'comments',
      populate: {
        path: 'createdBy',
        select: 'name', // Populate the 'name' field of the user who created the comment
      }
    })
    .populate({
      path: 'created_by',
      select: 'name', // Populate the 'name' field of the user who created the password
    })
    .populate({
      path: 'modifiedby',
      select: 'name', // Populate the 'name' field of the user who modified the password
    })
    .sort(sortOption);

    // Combine created and shared passwords
    const allPasswords = [...createdPasswords, ...sharedPasswords];

    // Enhance with shared item data
    const user = await User.findById(userId);

    const enhancedPasswords = allPasswords.map(password => {
      const isFavorite = user.favorites.includes(password._id);
      const sharedItem = sharedItems.find(item => item.itemId.toString() === password._id.toString());

      return {
        ...password.toObject(),
        isFavorite,
        sharedItem: sharedItem ? 
           sharedItem.sharedWith.find(sw => sw.userId.toString() === userId.toString()) : null
      };
    });

    const totalCount = createdPasswords.length + sharedPasswords.length;

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
    const deletedCount = await Password.deleteMany({ _id: { $in: ids } });

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
    const passwordIds = req.params.passwordId.split(',');
  
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    for (const id of passwordIds) {
      const password = await Password.findById(id);
      if (!password) {
        return res.status(404).json({ message: `Password with ID ${id} not found` });
      }
  
      const favoriteIndex = user.favorites.indexOf(id);
      if (favoriteIndex > -1) {
        user.favorites.splice(favoriteIndex, 1);
      } else {
        user.favorites.push(id);
      }
    }
  
    await user.save();
    return res.status(200).json({ message: 'Favorites updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating favorites' });
  }
};

exports.exportAllPasswords = async(req, res) => {
    try {
      const exportPasswordsIds = req.params.ids.split(",")
      const userId = req.user._id;
      const passwords = await Password.find({created_by: userId,  _id: { $in: exportPasswordsIds },}).populate('tags').lean() // Convert to plain JSON
      
      // Convert JSON to CSV
      const csv = parse(passwords);
      
      // Set headers for CSV download
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=passwords.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).send(error);
    }
}
exports.addTag = async (req, res) => {
  const { tagName, passwordId } = req.body;

  try {
    // Check if the tag already exists
    let tag = await Tag.findOne({ name: tagName });

    if (!tag) {
      // If tag does not exist, create a new one
      tag = new Tag({ name: tagName });
      await tag.save();
    }

    // Find the password by ID and add the tag reference
    const password = await Password.findById(passwordId);

    if (!password) {
      return res.status(404).json({ error: 'Password not found' });
    }
    if (!password.tags) {
      password.tags = [];
    }

    // Add the tag reference to the password if not already added
    if (!password.tags?.includes(tag._id)) {
      password.tags.push(tag._id);
      await password.save();
    }

    res.json({ message: 'Tag added to password successfully', tag, password });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the tag' });
  }
};
exports.postComment =  async (req, res) => {
  try {
      const { passwordId } = req.params;
      const createdBy = req.user._id;
      const { content } = req.body;

      // Create a new comment
      const newComment = new Comment({
          content,
          createdBy
      });

      // Save the comment
      await newComment.save();

      // Find the password entry and update it with the new comment
      const password = await Password.findById(passwordId);
      if (!password) {
          return res.status(404).json({ message: 'Password not found' });
      }

      password.comments.push(newComment._id);
      await password.save();

      res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};