const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import middleware
const testResultController = require('./testresult.controller');
const testResultValidations = require('./testresult.validations');
// const { uploadToS3 } = require('../../config/upload-to-s3'); // Assuming this handles S3 uploads
const Upload = require("../../middlewares/files"); // Using existing Upload middleware

const router = express.Router();

// Define permissions
const manageTestResultsPermission = 'manageTestResults';
const viewTestResultsPermission = 'viewTestResults'; // Students might have this for their own results

// Apply auth and schoolScope middleware. Upload middleware is per-route.
router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(
    auth(manageTestResultsPermission),
    Upload.uploadImages, // Existing upload middleware
    validate(testResultValidations.createTestResult),
    testResultController.createTestResultHandler
  )
  .get(
    auth(viewTestResultsPermission),
    validate(testResultValidations.getTestResults),
    testResultController.getTestResultsHandler
  );

router
  .route('/:resultId')
  .get(
    auth(viewTestResultsPermission),
    validate(testResultValidations.getTestResult),
    testResultController.getTestResultHandler
  )
  .patch(
    auth(manageTestResultsPermission),
    Upload.uploadImages, // Existing upload middleware for updates
    validate(testResultValidations.updateTestResult),
    testResultController.updateTestResultHandler
  )
  .delete(
    auth(manageTestResultsPermission),
    validate(testResultValidations.deleteTestResult),
    testResultController.deleteTestResultHandler
  );

module.exports = router;
