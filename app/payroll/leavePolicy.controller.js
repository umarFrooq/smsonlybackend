const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const leavePolicyService = require('./leavePolicy.service');

const createLeavePolicy = catchAsync(async (req, res) => {
  const leavePolicy = await leavePolicyService.createLeavePolicy(req.body);
  res.status(httpStatus.CREATED).send(leavePolicy);
});

const getLeavePolicies = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['school']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await leavePolicyService.queryLeavePolicies(filter, options);
  res.send(result);
});

const getLeavePolicy = catchAsync(async (req, res) => {
  const leavePolicy = await leavePolicyService.getLeavePolicyById(req.params.leavePolicyId);
  if (!leavePolicy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave policy not found');
  }
  res.send(leavePolicy);
});

const updateLeavePolicy = catchAsync(async (req, res) => {
  const leavePolicy = await leavePolicyService.updateLeavePolicyById(req.params.leavePolicyId, req.body);
  res.send(leavePolicy);
});

const deleteLeavePolicy = catchAsync(async (req, res) => {
  await leavePolicyService.deleteLeavePolicyById(req.params.leavePolicyId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createLeavePolicy,
  getLeavePolicies,
  getLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
};
