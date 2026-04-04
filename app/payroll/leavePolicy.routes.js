const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const leavePolicyValidation = require('./leavePolicy.validation');
const leavePolicyController = require('./leavePolicy.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageLeavePolicies'), validate(leavePolicyValidation.createLeavePolicy), leavePolicyController.createLeavePolicy)
  .get(auth('getLeavePolicies'), validate(leavePolicyValidation.getLeavePolicies), leavePolicyController.getLeavePolicies);

router
  .route('/:leavePolicyId')
  .get(auth('getLeavePolicies'), validate(leavePolicyValidation.getLeavePolicy), leavePolicyController.getLeavePolicy)
  .patch(auth('manageLeavePolicies'), validate(leavePolicyValidation.updateLeavePolicy), leavePolicyController.updateLeavePolicy)
  .delete(
    auth('manageLeavePolicies'),
    validate(leavePolicyValidation.deleteLeavePolicy),
    leavePolicyController.deleteLeavePolicy
  );

module.exports = router;
