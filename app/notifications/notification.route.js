const express = require('express');
const router = express.Router();
const validate = require('../../middlewares/validate');
// const bannerSetValidation = require("./banner-set.validation");
const auth = require('../../middlewares/auth');
const notificationController = require("./notification.controller");
const notificationValidation = require("./notification.validation");

router.route("/")
    .get(auth('notification'), validate(notificationValidation.findUserNotification), notificationController.findUserNotification)

module.exports = router;