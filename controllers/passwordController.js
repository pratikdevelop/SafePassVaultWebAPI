const Password = require('../model/password');
const User = require('../model/user');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const SharedItem = require('../model/shareItem'); 
const { parse } = require('json2csv');
const Tag = require('../model/tag')
const Comment = require('../model/comment')
const logger = require('../logger'); // Adjust the path as needed

// Get all passwords with pagination, sorting, and searching
exports.getAllPasswords = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = 'name', order = 'asc', search } = req.query;

    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };
    const searchQuery = search && search !== 'undefined'
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { website: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    logger.info(`Fetching all passwords for user: ${userId}`, {userId, page, limit, sort, order, search });

    const createdPasswords = await Password.find({ created_by: userId, ...searchQuery })
      .populate('tags')
      .populate({ path: 'comments', populate: { path: 'createdBy', select: 'name' } })
      .populate({ path: 'created_by', select: 'name' })
      .populate({ path: 'modifiedby', select: 'name' })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const sharedItems = await SharedItem.find({ 
      itemType: 'password', 
      'sharedWith.userId': userId 
    }).populate('itemId');

    const sharedPasswordIds = sharedItems.map(item => item.itemId);

    const sharedPasswords = await Password.find({ 
      _id: { $in: sharedPasswordIds }, 
      ...searchQuery 
    })
    .populate('tags')
    .populate({ path: 'comments', populate: { path: 'createdBy', select: 'name' } })
    .populate({ path: 'created_by', select: 'name' })
    .populate({ path: 'modifiedby', select: 'name' })
    .sort(sortOption);

    const allPasswords = [...createdPasswords, ...sharedPasswords];
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
    logger.error('Error fetching passwords', { userId, error: err.message });
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

    logger.info('Password created successfully', { passwordId: savedPassword._id, userId: req.user._id });

    res.json(savedPassword);
  } catch (err) {
    logger.error('Error creating password', { userId: req.user._id, error: err.message });
    res.status(400).json({ message: "Error creating password" });
  }
};

// Delete passwords by IDs
exports.deletePasswords = async (req, res) => {
  try {
    const ids = req.params.ids.split(',');
    const deletedCount = await Password.deleteMany({ _id: { $in: ids } });

    logger.info(`Deleting passwords`, { ids, deletedCount , userId: req.user._id });

    if (deletedCount.deletedCount === 0) {
      res.status(404).json({ message: "No passwords found or deleted" });
    } else {
      res.json({ message: `${deletedCount.deletedCount} passwords deleted` });
    }
  } catch (err) {
    logger.error('Error deleting passwords', { error: err.message });
    res.status(500).json({ message: "Error deleting passwords" });
  }
};

// Update a password by ID
exports.updatePassword = async (req, res) => {
  try {
    const updatedPassword = await Password.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPassword) {
      logger.warn('Password not found for update', { passwordId: req.params.id });
      return res.status(404).json({ message: "Password not found" });
    }

    logger.info('Password updated successfully', { passwordId: req.params.id, userId: req.user._id  });
    res.json(updatedPassword);
  } catch (err) {
    logger.error('Error updating password', { passwordId: req.params.id, error: err.message });
    res.status(500).json({ message: "Error updating password" });
  }
};

// Share a password
exports.sharePassword = async (req, res) => {
  const passwordId = req.params.passwordId;
  try {
    const password = await Password.findById(passwordId);

    if (!password) {
      logger.warn('Password not found for sharing', { passwordId });
      return res.status(404).json({ error: 'Password not found' });
    }

    const shareToken = jwt.sign({ _id: passwordId }, "2lZ2QpWg43");
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

    await Password.updateOne({ _id: passwordId }, { shareToken, shareExpiration: expirationDate });
    const shareLink = `http://your-domain/api/passwords/share/${passwordId}/${shareToken}`;

    logger.info('Password shared successfully', { passwordId, shareLink , userId: req.user._id });

    res.status(200).json({ shareLink });
  } catch (err) {
    logger.error('Error sharing password', { passwordId, error: err.message });
    res.status(500).json({ message: 'Error sharing password' });
  }
};

// Get a shared password
exports.getSharedPassword = async (req, res) => {
  const passwordId = req.params.passwordId;
  const shareToken = req.params.shareToken;

  try {
    const password = await Password.findById(passwordId);
    if (!password || password.shareToken !== shareToken || new Date() > password.shareExpiration) {
      logger.warn('Invalid share link or expired', { passwordId, shareToken, userId: req.user._id  });
      return res.status(400).json({ error: 'Invalid share link or expired',  });
    }

    const decryptedPassword = CryptoJS.AES.decrypt(password.password, password.key);
    res.json({ password: decryptedPassword.toString(CryptoJS.enc.Utf8) });
  } catch (err) {
    logger.error('Error retrieving shared password', { passwordId, error: err.message, userId: req.user._id  });
    res.status(500).json({ message: 'Error retrieving shared password' });
  }
};

// Add or remove a password from favorites
exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const passwordIds = req.params.passwordId.split(',');
  
    const user = await User.findById(userId);
    if (!user) {
      logger.warn('User not found', { userId });
      return res.status(404).json({ message: 'User not found' });
    }
  
    for (const id of passwordIds) {
      const password = await Password.findById(id);
      if (!password) {
        logger.warn('Password not found for toggle', { passwordId: id });
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
    logger.info('Favorites updated successfully', { userId });
    return res.status(200).json({ message: 'Favorites updated successfully' });
  } catch (err) {
    logger.error('Error updating favorites', { error: err.message, userId: req.user._id  });
    res.status(500).json({ message: 'Error updating favorites' });
  }
};

// Export all passwords
exports.exportAllPasswords = async (req, res) => {
  try {
    const exportPasswordsIds = req.query.ids.split(",");
    const userId = req.user._id;

    const passwords = await Password.find({ created_by: userId, _id: { $in: exportPasswordsIds } }).populate('tags').lean();
    const csv = parse(passwords);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=passwords.csv');
    logger.log({level:"error", message:
      `Exporting ${passwords.length} passwords for user ${userId}`,
      userId: req.user._id 
    })
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting passwords', { error: error.message, userId: req.user._id  });
    res.status(500).send(error);
  }
};

// Add a tag to a password
exports.addTag = async (req, res) => {
  const { tagName, passwordId } = req.body;

  try {
    let tag = await Tag.findOne({ name: tagName });

    if (!tag) {
      tag = new Tag({ name: tagName });
      await tag.save();
    }

    const password = await Password.findById(passwordId);

    if (!password) {
      logger.warn('Password not found for adding tag', { passwordId });
      return res.status(404).json({ error: 'Password not found' });
    }

    if (!password.tags) {
      password.tags = [];
    }

    if (!password.tags.includes(tag._id)) {
      password.tags.push(tag._id);
      await password.save();
      logger.info('Tag added to password successfully', { tag, passwordId });
    }

    res.json({ message: 'Tag added to password successfully', tag, password, userId: req.user._id  });
  } catch (error) {
    logger.error('Error adding tag', { error: error.message, userId: req.user._id  });
    res.status(500).json({ error: 'An error occurred while adding the tag' });
  }
};

// Post a comment
exports.postComment = async (req, res) => {
  try {
    const { passwordId } = req.params;
    const createdBy = req.user._id;
    const { content } = req.body;

    const newComment = new Comment({
      content,
      createdBy
    });

    await newComment.save();

    const password = await Password.findById(passwordId);
    if (!password) {
      logger.warn('Password not found for comment', { passwordId });
      return res.status(404).json({ message: 'Password not found' });
    }

    password.comments.push(newComment._id);
    await password.save();

    logger.info('Comment added successfully', { passwordId, commentId: newComment._id, userId: req.user._id  });
    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (error) {
    logger.error('Error posting comment', { error: error.message, userId: req.user._id  });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
