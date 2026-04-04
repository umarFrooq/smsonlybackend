const catchAsync = require("../../../utils/catchAsync");
const pushNotificationService = require("./push.notification.service");
const httpStatus = require("http-status");
const { sendNotification } = require("./push.notification.utils");

const createOrUpdate = catchAsync(async (req, res) => {
    const result = await pushNotificationService.createOrUpdate(req.body);
    res.status(httpStatus.OK).send(result);
})

const pushNotification = catchAsync(async (req, res) => {
    // sendNotification
    const result = await pushNotificationService.firebaseNotification(req.body.data, req.body.userId, req.body.role);
    res.status(httpStatus.OK).send(result);
})

const sendPushNotification = catchAsync(async (req, res) => {
    const result = await pushNotificationService.sendPushNotification(req.user, req.body, req.files);
    res.status(httpStatus.OK).send(result);
});

const fcmCustomer = catchAsync(async (req, res) => {
    const result = await pushNotificationService.fcmCustomer(req.body);
    res.status(httpStatus.OK).send(result);
})

const sendOneNotification = catchAsync(async (req, res) => {
    const result = await pushNotificationService.sendOneNotification(req.body, req.files);
    res.status(httpStatus.OK).send(result);
})
module.exports = {
    createOrUpdate,
    pushNotification,
    sendPushNotification,
    fcmCustomer,
    sendOneNotification
}