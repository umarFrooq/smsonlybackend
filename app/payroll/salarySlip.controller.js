const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { payrollService, salarySlipService } = require('.');
const ApiError = require('../../utils/ApiError');

const generateSalarySlip = catchAsync(async (req, res) => {
  const payroll = await payrollService.getPayrollById(req.params.payrollId);
  if (!payroll) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payroll not found');
  }
  const filePath = salarySlipService.generateSalarySlip(payroll);
  res.download(filePath);
});

module.exports = {
  generateSalarySlip,
};
