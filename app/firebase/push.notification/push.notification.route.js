const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const express = require('express');
const router = express.Router();
const pushNotificationController = require("./push.notification.controller");
const pushNotificaionValidation = require("./push.notification.validation");
const { uploadImages } = require('@/middlewares/files');

router.route("/")
    .post(validate(pushNotificaionValidation.createOrUpdate), pushNotificationController.createOrUpdate)
    .get(pushNotificationController.pushNotification);
router.route("/send").post(auth("manageFirebase"),uploadImages, validate(pushNotificaionValidation.sendPushNotification), pushNotificationController.sendPushNotification);
router.route("/send-one").post(auth("pushNotification"),uploadImages, validate(pushNotificaionValidation.sendOneNotification), pushNotificationController.sendOneNotification);
// router.route("/fcm")
//     .post(pushNotificationController.fcmCustomer)
module.exports = router;