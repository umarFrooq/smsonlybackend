const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const router = express.Router();
const ipnController = require("./alfaIPN.controller");
const ipnValidation = require("./alfaIPN.validation");

router
    .route('/alfa-callback')
    .post( auth("cardPayment"), validate(ipnValidation.createOrderDetail), ipnController.callBackIpn )
router
    .route('/return-url')
    .post( ipnController.listenerIpn )
module.exports = router;