const Card = require('../model/card'); // Assuming the schema file is named card.js
const User = require('../model/user')
const SharedItem = require("../model/shareItem");
// Create a new card
exports.createCard = async (req, res) => {
  try {
    req.body.userId = req.user._id;
    req.body.expiryDate = new Date()
    const {folderId} = req.body;
    if (!folderId) {
      return res.status(400).json({
        message: "Folder ID is required to create a new password",
      });
    } else {
      req.body["folder"] = folderId; // Set folder ID
    }
    const newCard = new Card(req.body);
    await newCard.save();
    res.status(201).send(newCard);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Get all cards
exports.getAllCards = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      sort = "cardType",
      order = "asc",
      search,
      folderId,
      filter = "all",
    } = req.query;

    // Set the sorting option
    const sortOption = { [sort]: order === "asc" ? 1 : -1 };

    // Construct the search query
    const searchQuery =
      search && search !== "undefined"
        ? {
            $or: [
              { cardType: { $regex: search, $options: "i" } },
              { cardHolderName: { $regex: search, $options: "i" } },
              { billingAddress: { $regex: search, $options: "i" } },
            ],
          }
        : {};

    // Initialize the main query object
    const query = { userId, ...searchQuery };

    // Apply folderId filter if provided
    if (folderId) query.folder = folderId;

    // Define filter-specific logic
    const user = await User.findById(userId);
    let sharedItems = [];
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
    console.log('ww', JSON.stringify(query));
    

    // Execute the query with sorting, pagination, and populate
    const cards = await Card.find(query)
      .populate("folder")
      .populate({ path: "userId", select: "name" })
      // .populate({ path: "modifiedby", select: "name" })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Enhance cards with favorites and shared item info
    const enhancedCards = await Promise.all(
      cards.map(async (card) => {
        const isFavorite = user.favorites.includes(card._id);
        const sharedItem = sharedItems.find(
          (item) => item.itemId.toString() === card._id.toString()
        );

        return {
          ...card.toObject(),
          isFavorite,
          sharedItem: sharedItem
            ? sharedItem.sharedWith.find(
                (sw) => sw.userId.toString() === userId.toString()
              )
            : null,
        };
      })
    );

    // Fetch the total count for pagination
    const totalCount = await Card.countDocuments(query);

    // Send the response with pagination metadata
    res.json({
      cards: enhancedCards,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        pageSize: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching cards" });
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


exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const cardIds = req.params.cardIds.split(",");

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    for (const id of cardIds) {
      const note = await Card.findById(id);
      if (!note) {
        return res
          .status(404)
          .json({ message: `Note with ID ${id} not found` });
      }

      const favoriteIndex = user.favorites.indexOf(id);
      if (favoriteIndex > -1) {
        user.favorites.splice(favoriteIndex, 1);
      } else {
        user.favorites.push(id);
      }
    }

    await user.save();
    return res.status(200).json({ message: "Favorites updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating favorites" });
  }
};
