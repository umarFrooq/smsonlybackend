const catchAsync = require('../../../utils/catchAsync');
const tcsServices = require("./tcs.service");
const httpStatus = require("http-status");

const placeOrder = catchAsync(async(req, res) => {
    const _placeOrder = await tcsServices.placeOrder(req.body);
    // res.status(httpStatus.OK).send(_placeOrder);
    res.sendStatus(_placeOrder);
});

const cancelOrder = catchAsync(async(req, res) => {
    const cancelOrder = await tcsServices.cancelOrder(req.body);
    // res.status(httpStatus.OK).send(cancelOrder);
    res.sendStatus(cancelOrder);
})

const trackOrder = catchAsync(async(req, res) => {
    const trackOrder = await tcsServices.trackOrders(req.body);
    // res.status(httpStatus.OK).send(trackOrder);
    res.sendStatus(trackOrder);
})

module.exports = {
    placeOrder,
    cancelOrder,
    trackOrder
}