const express = require('express');
const router = express.Router();
const simpleFeeController = require('./simpleFee.controller');
const auth = require('../../middlewares/auth');

// Only admin/super admin can add or update fee
router.post('/add', auth(), simpleFeeController.addOrUpdateFee);
// Get fee history for a student
router.get('/history/:studentId', auth(), simpleFeeController.getFeeHistory);

module.exports = router;
