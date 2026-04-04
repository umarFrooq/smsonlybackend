const express = require('express');
const statsController = require('./stats.controller');
const auth = require('../../middlewares/auth');
const visitStatsValidation = require('./stats.validation');
const validate = require('../../middlewares/validate');
const router = express.Router();

router
.route('/').get( auth("manageVisitStats"), validate(visitStatsValidation.getVisitStats ), statsController.getVisitStats );

router
.route('/ordercount').get(auth("manageStats"), validate(visitStatsValidation.getOrderStats), statsController.getOrderCount);
router
.route('/orderAge').get(auth("manageStats"), validate(visitStatsValidation.getOrderStats), statsController.averageStatusAge);

module.exports = router;