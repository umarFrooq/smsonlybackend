const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const payrollService = require('./payroll.service');


const getPayrolls = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['teacher', 'month', 'year', 'status', 'branch', 'branchId', 'schoolId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await payrollService.queryPayrolls(filter, options);
  res.send(result);
});

const getPayroll = catchAsync(async (req, res) => {
  const payroll = await payrollService.getPayrollById(req.params.payrollId);
  if (!payroll) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payroll not found');
  }
  res.send(payroll);
});

const updatePayroll = catchAsync(async (req, res) => {
  const payroll = await payrollService.updatePayrollById(req.params.payrollId, req.body);
  res.send(payroll);
});

const deletePayroll = catchAsync(async (req, res) => {
  await payrollService.deletePayrollById(req.params.payrollId);
  res.status(httpStatus.NO_CONTENT).send();
});

const generatePayroll = catchAsync(async (req, res) => {
  const { schoolId, branchId, month, year } = req.body;
  const payrolls = await payrollService.generatePayroll(schoolId, branchId, month, year);
  res.status(httpStatus.CREATED).send(payrolls);
});

module.exports = {
  getPayrolls,
  getPayroll,
  updatePayroll,
  deletePayroll,
  generatePayroll,
};
