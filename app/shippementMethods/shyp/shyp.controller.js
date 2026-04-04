const catchAsync = require('../../../utils/catchAsync');
const shypService = require("./shyp.service");
const httpStatus = require("http-status");

const getCities = catchAsync(async(req, res) => {
    const _placeOrder = await shypService.getCities(req.body);
    res.sendStatus(_placeOrder);
});

const shypSourceCities = catchAsync(async(req, res) => {
    const _placeOrder = await shypService.shypSourceCities(req.body);
    res.sendStatus(_placeOrder);
});

module.exports = {
    getCities,
    shypSourceCities
}