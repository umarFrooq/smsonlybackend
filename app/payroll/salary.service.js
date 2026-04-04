const httpStatus = require('http-status');
const Salary = require('./salary.model');
const ApiError = require('../../utils/ApiError');

/**
 * Create a salary
 * @param {Object} salaryBody
 * @returns {Promise<Salary>}
 */
const createSalary = async (salaryBody) => {
  const { teacherId, schoolId, branchId, basic = 0, allowances = [], deductions = [], bonuses = [] } = salaryBody;

  // compute totals
  const sumArray = (arr) => (Array.isArray(arr) ? arr.reduce((s, it) => s + (Number(it.amount) || 0), 0) : 0);
  const totalAllowances = sumArray(allowances);
  const totalDeductions = sumArray(deductions);
  const totalBonuses = sumArray(bonuses);
  const net = Number(basic) + totalAllowances + totalBonuses - totalDeductions;

  // attach computed fields
  const payload = { ...salaryBody, net };

  if (teacherId && schoolId && branchId) {
    const filter = { teacherId, schoolId, branchId };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };
    const updated = await Salary.findOneAndUpdate(filter, { $set: payload }, options);
    return updated;
  }

  const salary = await Salary.create(payload);
  return salary;
};

/**
 * Query for salaries
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySalaries = async (filter, options) => {
  const salaries = await Salary.paginate(filter, { ...options, populate: 'teacherId' });
  return salaries;
};

/**
 * Get salary by id
 * @param {ObjectId} id
 * @returns {Promise<Salary>}
 */
const getSalaryById = async (id) => {
  return Salary.findById(id);
};

/**
 * Update salary by id
 * @param {ObjectId} salaryId
 * @param {Object} updateBody
 * @returns {Promise<Salary>}
 */
const updateSalaryById = async (salaryId, updateBody) => {
  const salary = await getSalaryById(salaryId);
  if (!salary) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Salary not found');
  }
  // If monetary parts provided, recompute net
  const basic = updateBody.basic !== undefined ? updateBody.basic : salary.basic;
  const allowances = updateBody.allowances !== undefined ? updateBody.allowances : salary.allowances || [];
  const deductions = updateBody.deductions !== undefined ? updateBody.deductions : salary.deductions || [];
  const bonuses = updateBody.bonuses !== undefined ? updateBody.bonuses : salary.bonuses || [];
  const sumArray = (arr) => (Array.isArray(arr) ? arr.reduce((s, it) => s + (Number(it.amount) || 0), 0) : 0);
  const totalAllowances = sumArray(allowances);
  const totalDeductions = sumArray(deductions);
  const totalBonuses = sumArray(bonuses);
  const net = Number(basic) + totalAllowances + totalBonuses - totalDeductions;

  Object.assign(salary, { ...updateBody, net });
  await salary.save();
  return salary;
};

/**
 * Delete salary by id
 * @param {ObjectId} salaryId
 * @returns {Promise<Salary>}
 */
const deleteSalaryById = async (salaryId) => {
  const salary = await getSalaryById(salaryId);
  if (!salary) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Salary not found');
  }
  await salary.remove();
  return salary;
};

module.exports = {
  createSalary,
  querySalaries,
  getSalaryById,
  updateSalaryById,
  deleteSalaryById,
};
