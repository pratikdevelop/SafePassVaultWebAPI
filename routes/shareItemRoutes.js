const express = require('express');
const router = express.Router();
const itemController = require('../controllers/shareItem');
// Share an item
router.post('/share-item', itemController.shareItem);

// Get all items of a specific type (own + shared)
router.get('/items/:itemType', itemController.getItems);
module.exports = router;
