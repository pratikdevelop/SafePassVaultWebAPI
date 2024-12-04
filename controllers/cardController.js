const Card = require('../model/card'); // Assuming the schema file is named card.js
const User = require('../model/user')
const SharedItem = require("../model/shareItem");
const AuditLog = require('../model/Auditlogs'); // Adjust path accordingly



exports.createCard = async (req, res) => {
  try {
    req.body.userId = req.user._id;
    req.body.expiryDate = new Date();
    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({
        message: "Folder ID is required to create a new password",
      });
    } else {
      req.body["folder"] = folderId; // Set folder ID
    }

    const newCard = new Card(req.body);
    await newCard.save();

    // Log the card creation
    const auditLog = new AuditLog({
      userId: req.user._id,
      action: 'create',
      entity: 'card',
      entityId: newCard._id,
      newValue: newCard,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await auditLog.save();

    res.status(201).send(newCard);
  } catch (error) {
    res.status(400).send(error);
  }
};



exports.getAllCards = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = "cardType", order = "asc", search, folderId, filter = "all" } = req.query;

    const sortOption = { [sort]: order === "asc" ? 1 : -1 };

    const searchQuery = search && search !== "undefined"
      ? {
        $or: [
          { cardType: { $regex: search, $options: "i" } },
          { cardHolderName: { $regex: search, $options: "i" } },
          { billingAddress: { $regex: search, $options: "i" } },
        ],
      }
      : {};

    const query = { userId, ...searchQuery };

    if (folderId) query.folder = folderId;

    const user = await User.findById(userId);
    let sharedItems = [];

    // Filter logic
    switch (filter) {
      case "favourite":
        query._id = { $in: user?.favorites };
        break;
      case "shared_with_me":
        sharedItems = await SharedItem.find({
          itemType: "card",
          "sharedWith.userId": userId,
        }).populate("itemId");

        const sharedCardIds = sharedItems.map((item) => item.itemId);
        query._id = { $in: sharedCardIds };
        break;
      case "created_by_me":
        query.created_by = userId;
        break;
      case "all":
      default:
        query.$or = [{ userId: userId }];
        sharedItems = await SharedItem.find({
          itemType: "card",
          "sharedWith.userId": userId,
        }).populate("itemId");

        const sharedCardIdsForAll = sharedItems.map((item) => item.itemId);
        if (sharedCardIdsForAll.length > 0) {
          query.$or.push({ _id: { $in: sharedCardIdsForAll } });
        }
        break;
    }

    // Execute the query with sorting, pagination
    const cards = await Card.find(query)
      .populate("folder")
      .populate({ path: "userId", select: "name" })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Card.countDocuments(query);

    res.json({
      cards,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        pageSize: Number(limit),
      },
    });

    // Log the card retrieval
    const auditLog = new AuditLog({
      userId,
      action: 'fetch',
      entity: 'card',
      entityId: null,
      newValue: { query, results: cards.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await auditLog.save();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching cards" });
  }
};


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

    const oldCard = { ...card.toObject() };

    updates.forEach((update) => card[update] = req.body[update]);
    await card.save();

    // Log the card update
    const auditLog = new AuditLog({
      userId: req.user._id,
      action: 'update',
      entity: 'card',
      entityId: card._id,
      oldValue: oldCard,
      newValue: card,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await auditLog.save();

    res.send(card);
  } catch (error) {
    res.status(400).send(error);
  }
};


exports.deleteCard = async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) {
      return res.status(404).send();
    }

    // Log the card deletion
    const auditLog = new AuditLog({
      userId: req.user._id,
      action: 'delete',
      entity: 'card',
      entityId: card._id,
      oldValue: card,
      newValue: null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await auditLog.save();

    res.send(card);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const cardIds = req.params.cardIds.split(",");

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedFavorites = [];
    for (const id of cardIds) {
      const card = await Card.findById(id);
      if (!card) {
        return res.status(404).json({ message: `Card with ID ${id} not found` });
      }

      const favoriteIndex = user.favorites.indexOf(id);
      if (favoriteIndex > -1) {
        user.favorites.splice(favoriteIndex, 1);
      } else {
        user.favorites.push(id);
      }

      updatedFavorites.push(id);
    }

    await user.save();

    // Log the favorite toggle action
    const auditLog = new AuditLog({
      userId,
      action: 'toggle_favorite',
      entity: 'card',
      entityId: updatedFavorites,
      newValue: user.favorites,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await auditLog.save();

    res.status(200).json({ message: "Favorites updated successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error updating favorites",
    });
  }
};
