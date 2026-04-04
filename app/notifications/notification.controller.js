const catchAsync =require("@/utils/catchAsync") ;
const notificationService = require("./notification.service");
const httpStatus = require("http-status");

const findUserNotification = catchAsync(async (req, res) => {
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await notificationService.findUserNotification(req.user.id, options);
    // res.status(httpStatus.OK).send(result);
    res.sendStatus(result.data,result.status,result.message);
})

module.exports = {
    findUserNotification
};