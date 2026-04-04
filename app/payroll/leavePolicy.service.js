const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const LeavePolicy = require('./leavePolicy.model');

/**
 * Create a leave policy
 * @param {Object} leavePolicyBody
 * @returns {Promise<LeavePolicy>}
 */
const createLeavePolicy = async (leavePolicyBody) => {
  const { school } = leavePolicyBody;
  if (school) {
    const filter = { school };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };
    const updated = await LeavePolicy.findOneAndUpdate(filter, { $set: leavePolicyBody }, options);
    return updated;
  }
  const leavePolicy = await LeavePolicy.create(leavePolicyBody);
  return leavePolicy;
};

/**
 * Query for leave policies
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryLeavePolicies = async (filter, options) => {
  const leavePolicies = await LeavePolicy.paginate(filter, options);
  return leavePolicies;
};

/**
 * Get leave policy by id
 * @param {ObjectId} id
 * @returns {Promise<LeavePolicy>}
 */
const getLeavePolicyById = async (id) => {
  return LeavePolicy.findById(id);
};

/**
 * Update leave policy by id
 * @param {ObjectId} leavePolicyId
 * @param {Object} updateBody
 * @returns {Promise<LeavePolicy>}
 */
const updateLeavePolicyById = async (leavePolicyId, updateBody) => {
  const leavePolicy = await getLeavePolicyById(leavePolicyId);
  if (!leavePolicy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave policy not found');
  }
  Object.assign(leavePolicy, updateBody);
  await leavePolicy.save();
  return leavePolicy;
};

/**
 * Delete leave policy by id
 * @param {ObjectId} leavePolicyId
 * @returns {Promise<LeavePolicy>}
 */
const deleteLeavePolicyById = async (leavePolicyId) => {
  const leavePolicy = await getLeavePolicyById(leavePolicyId);
  if (!leavePolicy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave policy not found');
  }
  await leavePolicy.remove();
  return leavePolicy;
};

module.exports = {
  createLeavePolicy,
  queryLeavePolicies,
  getLeavePolicyById,
  updateLeavePolicyById,
  deleteLeavePolicyById,
};
