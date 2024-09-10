const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan-controller');

router.get('/', planController.getStripePlans)
router.post('/create-payment', planController.createPayment);
module.exports = router;
