const repService = require("./report.service");
const catchAsync = require("../../utils/catchAsync");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const pick = require("../../utils/pick");

const createReport = catchAsync(async (req, res) => {
  const result = await repService.createReport(req.body,req.user);
  res.status(httpStatus.CREATED).send(result);
});



const repById = catchAsync(async (req, res) => {
  const result = await repService.repById(req.params.id);
  res.status(httpStatus.OK).send(result);
});


const getAllAdmin = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    "type",
    "typeId",
    "userId",
    "mainRef",
    

    "to",
    "from",
  ]);
  const options = pick(req.query, ["limit", "page", "sortBy"]);
  const result = await repService.getAllRep(filter, options, req.user);
  res.status(httpStatus.OK).send(result);
});




const createAction = catchAsync(async (req, res) => {
  const result = await repService.createAction(req.body,req.user);
  res.status(httpStatus.CREATED).send(result);
});
module.exports = {
  createReport,
  repById,
  createAction,
  getAllAdmin
};
