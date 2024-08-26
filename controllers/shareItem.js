const User = require('../model/user')
const SharedItem = require('../model/shareItem')
const Password = require('../model/password')
const File = require('../model/file-storage');
const Card = require('../model/card');
const Note = require('../model/note');
const Identity = require('../model/proofid');
exports.shareItem = async (req, res) => {
  try {
    const { itemType, itemId, users, permissions } = req.body; // `users` is an array of user objects
    const ownerId = req.user._id;

    // Validate the item based on its type
    const Model = getModelByItemType(itemType);
    const itemsIDs = itemId.split(','); // Convert itemId string to an array of IDs
    const items = await Model.find({ _id: { $in: itemsIDs } });

    if (!items || items.length === 0) {
      return res.status(404).json({ message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found` });
    }

    // Iterate over each itemId to process sharing individually
    for (let singleItemId of itemsIDs) {
      let sharedItem = await SharedItem.findOne({ ownerId, itemType, itemId: singleItemId });

      if (sharedItem) {
        // Update permissions for each user
        users.forEach(user => {
          const existingShare = sharedItem.sharedWith.find(share => share.userId.equals(user.userId));
          if (existingShare) {
            existingShare.permissions = user.permissions; // Update permissions if the user already has access
          } else {
            sharedItem.sharedWith.push({ userId: user.userId, permissions: user.permissions }); // Add new user with permissions
          }
        });
        await sharedItem.save();
      } else {
        // Create a new shared item entry for each itemId
        sharedItem = new SharedItem({
          ownerId,
          itemType,
          itemId: singleItemId,
          sharedWith: users.map(user => ({
            userId: user.userId,
            permissions: user.permissions
          }))
        });
        await sharedItem.save();
      }
    }

    res.status(200).json({ message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} shared successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sharing item' });
  }
};

  
  // Helper function to get the correct model based on the itemType
  const getModelByItemType = (itemType) => {
    switch (itemType) {
      case 'password':
        return Password;
      case 'file':
        return File;
      case 'card':
        return Card;
      case 'note':
        return Note;
      case 'identity':
        return Identity;
      default:
        throw new Error('Invalid item type');
    }
  };
  

  exports.getItems = async (req, res) => {
    try {
      const userId = req.user._id;
      const itemType = req.params.itemType;
  
      // Fetch user's own items
      const Model = getModelByItemType(itemType);
      const ownItems = await Model.find({ userId });
  
      // Fetch items shared with the user
      const sharedItems = await SharedItem.find({ sharedWithUserId: userId, itemType })
        .populate('itemId');
  
      // Combine both
      const items = [
        ...ownItems,
        ...sharedItems.map(shared => ({
          ...shared.itemId._doc,
          permissions: shared.permissions
        }))
      ];
  
      res.status(200).json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Error fetching ${itemType}s` });
    }
  };
  