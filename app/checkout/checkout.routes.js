const express = require('express');
const router = express.Router();
let checkoutController = require('./checkout.controller')

router.route('/').post(checkoutController.createSession)
router.route('/webhook').post(checkoutController.webHook)
module.exports = router