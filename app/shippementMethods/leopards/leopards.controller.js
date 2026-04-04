const catchAsync = require('../../../utils/catchAsync');
const leoServices = require("./leopards.service");
const httpStatus = require("http-status");

const getCities = catchAsync(async(req, res) => {
    const _placeOrder = await leoServices.getCities(req.body);
    // res.status(httpStatus.OK).send(_placeOrder);
    res.sendStatus(_placeOrder);
});

module.exports = {
    getCities
}