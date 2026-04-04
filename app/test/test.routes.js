const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import middleware
const testController = require('./test.controller');
const testValidations = require('./test.validations');

const router = express.Router();

// Define permissions
const manageTestsPermission = 'manageTests';
const viewTestsPermission = 'viewTests';

// Apply auth and schoolScope middleware
router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(auth(manageTestsPermission), validate(testValidations.createTest), testController.createTestHandler)
  .get(auth(viewTestsPermission), validate(testValidations.getTests), testController.getTestsHandler);

router
  .route('/:testId')
  .get(auth(viewTestsPermission), validate(testValidations.getTest), testController.getTestHandler)
  .patch(auth(manageTestsPermission), validate(testValidations.updateTest), testController.updateTestHandler)
  .delete(auth(manageTestsPermission), validate(testValidations.deleteTest), testController.deleteTestHandler);

module.exports = router;
