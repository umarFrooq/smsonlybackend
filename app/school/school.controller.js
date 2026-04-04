const { uploadToS3 } = require('../../config/upload-to-s3');
const School = require('./school.model');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');

const updateSchoolLogoHandler = catchAsync(async (req, res) => {
  const { schoolId } = req.params;
  // Normalize possible shapes for req.user.schoolId (string | ObjectId | populated object)
  const extractId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
    // ObjectId
    try {
      return String(val);
    } catch (e) {
      return null;
    }
  };

  const userSchoolId = extractId(req.user && req.user.schoolId);
  // Allow rootUser always. For others, allow only when their schoolId matches the param.
  if (req.user.role !== 'rootUser' && (!userSchoolId || String(userSchoolId) !== String(schoolId))) {
    // Log debug info to help trace why a valid admin might be blocked
    console.error('[school.logo] Forbidden update attempt', {
      userId: req.user && (req.user.id || req.user._id),
      userRole: req.user && req.user.role,
      userSchoolId,
      requestedSchoolId: schoolId,
    });
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own school logo');
  }
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Logo file is required');
  }
  // Upload to S3
  const [logoUrl] = await uploadToS3({ file: req.file, folderName: 'school-logos' });
  // Update school
  const school = await School.findByIdAndUpdate(schoolId, { logo: logoUrl }, { new: true });
  if (!school) throw new ApiError(httpStatus.NOT_FOUND, 'School not found');
  res.send({ logo: school.logo });
});
const schoolService = require('./school.service');
const ApiError = require('../../utils/ApiError');

const createSchoolHandler = catchAsync(async (req, res) => {
  const { nameOfSchool, adminEmail } = req.body;
  // The schoolService.createSchoolAndAdmin expects the first param as an object {nameOfSchool: ...}
  const result = await schoolService.createSchoolAndAdmin({ nameOfSchool }, adminEmail);
  res.status(httpStatus.CREATED).send(result);
});

const getSchoolsHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']); // Add other filterable fields if needed
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await schoolService.querySchools(filter, options);
  res.send(result);
});

const getSchoolHandler = catchAsync(async (req, res) => {
  const school = await schoolService.getSchoolById(req.params.schoolId);
  // getSchoolById service function already throws ApiError if not found,
  // so no need to check for !school here explicitly unless adding more logic.
  res.send(school);
});

const updateSchoolHandler = catchAsync(async (req, res) => {
  // The service's updateSchoolById expects the name to be 'name' if passed in body,
  // but validation takes 'nameOfSchool'. We should be consistent.
  // Let's assume validation sends `nameOfSchool` and service expects `name`.
  // Or, adjust validation/service to use consistent naming.
  // For now, if req.body.nameOfSchool exists, map it to req.body.name for the service.
  const updateBody = { ...req.body };
  if (updateBody.nameOfSchool) {
    updateBody.name = updateBody.nameOfSchool;
    delete updateBody.nameOfSchool; // Clean up to avoid confusion in service
  }

  const school = await schoolService.updateSchoolById(req.params.schoolId, updateBody);
  res.send(school);
});

const deleteSchoolHandler = catchAsync(async (req, res) => {
  await schoolService.deleteSchoolById(req.params.schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSchoolHandler,
  getSchoolsHandler,
  getSchoolHandler,
  updateSchoolHandler,
  deleteSchoolHandler,
  updateSchoolLogoHandler,
};
