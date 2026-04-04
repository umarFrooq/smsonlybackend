const express = require('express');
const auth = require('../../middlewares/auth');
const logController = require("./logs.controller");
const validate = require('../../middlewares/validate');
const logValidation = require('./logs.validation');


const router = express.Router();

router
  .route('/')
  //.post(auth('manageAddress'),validate(orderValidation.createOrder), addressController.createAddress)
  .get( auth("manageLogs"), validate(logValidation.filterLogs), logController.fileConverter );
  // .post( logController.fileUploader );

  module.exports = router;