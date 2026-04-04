/**
 * Vintega Solutions
 *
 * User Controller, it encapsulates all user related methods.
 * These methods are called via API endpoints. Some endpoints may require admin level authorization.
 * 
 * @summary User Controller, called via API endpoints
 * @author Muhammad Mustafa
 *
 * Created at     : 2020-08-03 13:52:11 
 * Last modified  : 2020-08-03 14:01:18
 */


/**
 * @function getUsers //called via API endpoint
 *
 * @param {*} req // Query and body parameters
 * @param {*} res // API Response
 * @param {*} next // not used at the moment
 * @returns API Response
 */
//TODO: Document all methods and correct response messages accordingly

const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const userService = require('./user.service');
const en=require('../../config/locales/en')
const { logEvent } = require('../analytics/analytics.service');
const feeService = require('../fee/fee.service');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  await logEvent({ module: 'user', action: 'create', userId: user._id, details: req.body });
  res.sendStatus({ user });
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullname', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Enforce schoolId isolation: 
  // Non-root users should only be able to see users from their own school.
  const schoolId = req.user?.role !== 'rootUser' ? req.user?.schoolId : req.query.schoolId;

  const result = await userService.queryUsers(filter, options, schoolId);
  await logEvent({ module: 'user', action: 'query', userId: req.user ? req.user.id : null, details: { ...filter, schoolId } });
  res.status(httpStatus.OK).send(result);
});
const getRequestedSellers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullname', 'email']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryRequestedSellers(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result)
});
const getSellers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullname', 'phone', 'email']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.querySellers(filter, options);
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result)
});
const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  res.send(user);
});
const getUserPhone = catchAsync(async (req, res) => {
  const result = await userService.getUserPhone(req.user, req.body.userId);

  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);
});

const getSellerHome = catchAsync(async (req, res) => {

  const result = await userService.getSellerHome({});
  // res.status(httpStatus.OK).send(result);
  res.sendStatus(result);

});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND,'USER_NOT_FOUND');
  }
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user);
});

const getUserFees = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['monthYear', 'status', 'gradeId', 'branchId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  // Force student filter
  filter.studentId = req.params.userId;

  // Determine school context
  let schoolId = req.user && req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user && req.user.role !== 'rootUser' && req.user.role !== 'student') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }

  // If a student is requesting, ensure they can only access their own fees
  if (req.user && req.user.role === 'student' && req.user.id.toString() !== req.params.userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to view these fees.');
  }

  const result = await feeService.queryFees(filter, options, schoolId);
  res.status(httpStatus.OK).send(result);
});

const updateStatus = catchAsync(async (req, res) => {
  const user = await userService.updateStatus(req.user, req.params.userId, req.body);
  console.log(user)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user);
});

const updateUser = catchAsync(async (req, res) => { 
  const user = await userService.updateProfile(req.user, req.params.userId, req.body);
  // res.send(user);
  res.sendStatus(user);
});

const acceptRequestedSeller = catchAsync(async (req, res) => {
  const user = await userService.acceptRequestedSeller(req.body.userId);
  // res.send(user);
  res.sendStatus(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId, req.user?.schoolId, req.user?.role);
  res.sendStatus();
});

const changePassword = catchAsync(async (req, res) => {
  const user = await userService.changePassword(req.user, req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user);
});
const changePasswordAdmin = catchAsync(async (req, res) => {
  const user = await userService.changePasswordAdmin(req.user, req.body);
  // res.status(httpStatus.OK).send(user)
  res.sendStatus(user.data,user.status,user.message);
});

const getByRefCode = catchAsync(async (req, res) => {
  const user = await userService.getByRefCode(req.query.refCode, null, req.user.id);
  if (user && user.data && user.isSuccess) {
    delete user.data.user;
    // res.status(httpStatus.OK).send(user);
    res.sendStatus(user.data,user.status,user.message);
  }
  else {
    throw new ApiError(user.status, user.message);

  }
})

const updateRefCode = catchAsync(async (req, res) => {
  const user = await userService.updateRefCode(req.user.id, req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message);

})

const addOnWallet = catchAsync(async (req, res) => {
  const user = await userService.addOnWallet(req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message);
})

const updateBulkRefCode = catchAsync(async (req, res) => {
  const user = await userService.updateBulkRefCode();
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message);
})

const updateWalletPin = catchAsync(async (req, res) => {
  const user = await userService.updateWalletPin(req.user, req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message);
})

const createWalletPin = catchAsync(async (req, res) => {
  const user = await userService.createWalletPin(req.user, req.body);
  // res.status(httpStatus.OK).send(user);
  res.sendStatus(user.data,user.status,user.message)
})

const getAllUsers = catchAsync(async (req, res) => {
  // This function seems to be for a different use case or an older version.
  // We are focusing on getAllUser for the /v2/users/admin endpoint.
  // For consistency, if this were also to be updated, it would follow similar logic to getAllUser.
  const filter = pick(req.query, ['search', 'email', 'to', 'from', 'role', 'city', 'status', 'branchId', 'lang']); // Added search, status, branchId
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  // const searchOb = pick(req.query, ['name', 'value']); // Old search object
  const result = await userService.getAllUsers(filter, options); // Pass filter directly
  res.sendStatus(result);
});

const getAllUser = catchAsync(async (req, res) => { // This is linked to /v2/users/admin
  // Updated to pick new filter params: search, status, branchId. Removed name, value.
  const filter = pick(req.query, ['search', 'role', 'status', 'branchId', 'gradeId', 'email', 'to', 'from', 'city', 'lang']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']); // Added populate
  const search = pick(req.query, ['name', 'value']);
  // The 'search' string is now part of the 'filter' object.
  // The 'search' object {name, value} is no longer needed for userService.getAllUser
  // If the requester is a student, only return that student's own profile (do not allow listing other users)
  if (req.user && req.user.role === 'student') {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).send({ code: 404, data: null, message: 'User not found' });
    }
    const resp = {
      page: 1,
      totalPages: 1,
      limit: 1,
      totalResult: 1,
      results: [user]
    };
    return res.status(200).send({ data: resp, status: 200, message: 'OK' });
  }

  const result = await userService.getAllUser(filter, options,search, req.schoolId); // Removed old 'search' object param
  res.sendStatus(result);
});
module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getProfile,
  getUserPhone,
  getSellers,
  getRequestedSellers,
  acceptRequestedSeller,
  getSellerHome,
  changePassword,
  getByRefCode,
  updateRefCode,
  addOnWallet,
  updateBulkRefCode,
  createWalletPin,
  updateWalletPin,
  getAllUsers,
  getUserFees,
  changePasswordAdmin,
  updateStatus,
  getAllUser
};
