const catchAsync = require('../../utils/catchAsync');
const httpStatus = require('http-status');
const userService = require('../user/user.service');
const tokenService = require('../auth/token.service');
const ApiError = require('../../utils/ApiError');

const createStudent = catchAsync(async (req, res) => {
  // Admin or superadmin will call this; schoolId may be available on req.user
  const schoolId = req.user && req.user.schoolId;
  // Allow superadmin to create teacher/admin via this endpoint by passing role in body
  const requestedRole = req.body.role || 'student';
  if (requestedRole !== 'student') {
    // Only superadmin can create non-student scoped roles via this endpoint
    if (!req.user || req.user.role !== 'superadmin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only superadmin can create this role');
    }
    // Forward to createUser which handles role-specific validations
    const user = await userService.createUser(req.body, schoolId);
    return res.status(httpStatus.CREATED).send({ user });
  }

  const student = await userService.createStudent(req.body, schoolId);
  res.status(httpStatus.CREATED).send({ student });
});

const createAccountForStudent = catchAsync(async (req, res) => {
  const studentId = req.params.id;
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(httpStatus.BAD_REQUEST, 'Email and password required');
  const student = await userService.createAccountForExistingStudent(studentId, email, password, req.user?.schoolId);
  // Optionally generate auth tokens for the newly created account
  const tokens = await tokenService.generateAuthTokens(student);
  res.status(httpStatus.OK).send({ user: student, tokens });
});

module.exports = {
  createStudent,
  createAccountForStudent,
};
