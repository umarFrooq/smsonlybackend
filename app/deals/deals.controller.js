const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const catchAsync = require("../../utils/catchAsync");
const dealService = require("./deals.service")


const createSellerDeal = catchAsync(async (req, res) => {
    const createGroupBy = await dealService.createSellerDeal(req.body,req.user);
    res.status(httpStatus.OK).send(createGroupBy);
});


const updateSellerDeal = catchAsync(async (req, res) => {
    const updateGroupBuy = await dealService.updateSellerDeal(req.body, req.params.dealId);
    res.status(httpStatus.OK).send(updateGroupBuy);
});


const getAdminDeal = catchAsync(async (req, res) => {
    // const filter = pick(req.query, ['startDate', 'endDate', 'status']);
    const search = pick(req.query, ['name', 'value'])
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await dealService.queryAdminDeal( options,search);
    res.status(httpStatus.OK).send(result);
  });

  const getDealById = catchAsync(async (req, res) => {
    const deal = await dealService.getDealById(req.params.dealId);
    res.status(httpStatus.OK).send(deal);
  });

  const deleteDeal = catchAsync(async (req, res) => {
    const _deleteDeal = await dealService.deleteDeal(req.params.dealId);
    res.status(httpStatus.OK).send(_deleteDeal);
  });

  const updateStatuses = catchAsync(async (req, res) => {
    const updateStatuses = await dealService.updateStatuses(req.query.auth);
    res.status(httpStatus.OK).send(updateStatuses);
  });


module.exports = {
    createSellerDeal,
    updateSellerDeal,
    getAdminDeal,
    getDealById,
    deleteDeal,
    updateStatuses
};
