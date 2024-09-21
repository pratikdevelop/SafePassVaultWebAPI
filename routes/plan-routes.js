const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan-controller');

router.get('/', planController.getPlans)
router.post('/create-payment', planController.createSubscriptions);
module.exports = router;
