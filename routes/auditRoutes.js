const express = require('express');
const router = express.Router();
const auditcontroller = require('../controllers/auditcontroller');

router.get('/', auditcontroller.getUserAuditLogs);

module.exports = router;

