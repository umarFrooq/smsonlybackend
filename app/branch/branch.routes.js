const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import the new middleware
const branchController = require('./branch.controller');
const branchValidations = require('./branch.validations');

const router = express.Router();

// Apply auth and schoolScope middleware to all routes in this file
// as branch management is school-specific for superadmin.
// rootUser might have different routes or bypass schoolScope if they manage branches globally.
router.use(auth('manageBranches'), schoolScopeMiddleware); // manageBranches perm for superadmin

router
  .route('/')
  .post(auth('manageBranches'),validate(branchValidations.createBranch), branchController.createBranchHandler)
  .get(auth('manageBranches'),validate(branchValidations.getBranches), branchController.getBranchesHandler);

router
  .route('/:branchId')
  .get(validate(branchValidations.getBranch), branchController.getBranchHandler)
  .patch(validate(branchValidations.updateBranch), branchController.updateBranchHandler)
  .delete(validate(branchValidations.deleteBranch), branchController.deleteBranchHandler);

module.exports = router;
