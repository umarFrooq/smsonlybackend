const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const assignmentValidation = require('./assignment.validations');
const assignmentController = require('./assignment.controller');

const router = express.Router();

// Permissions (these should be defined in your RBAC system)
const MANAGE_OWN_ASSIGNMENTS = 'manageOwnAssignments'; // For teachers: CRUD on their own assignments
const VIEW_ALL_ASSIGNMENTS_SCHOOL = 'viewAllAssignmentsSchool'; // For admins: Read all assignments in their school
const VIEW_ASSIGNMENTS_BRANCH = 'viewAssignmentsBranch'; // For branchAdmins: Read assignments in their branch
const VIEW_ASSIGNMENTS_GRADE = 'viewAssignmentsGrade'; // For students: Read assignments for their grade
const MANAGE_ALL_ASSIGNMENTS_SCHOOL = 'manageAllAssignmentsSchool'; // For admins to manage any assignment in their school
const MANAGE_ALL_ASSIGNMENTS_ROOT = 'manageAllAssignmentsRoot'; // For rootUser to manage any assignment

// Apply auth and schoolScope middleware to all /assignments routes
// Specific permissions will be checked per route.
router.use(auth(), schoolScopeMiddleware); // schoolScopeMiddleware will extract schoolId for non-root users

router
  .route('/')
  .post(
    auth('manageAssignments'),
    validate(assignmentValidation.createAssignment),
    assignmentController.createAssignmentHandler
  )
  .get(
    auth('getAssignments'),
    validate(assignmentValidation.getAssignments),
    assignmentController.getAssignmentsHandler
  );

router
  .route('/:assignmentId')
  .get(
    auth('getAssignments'),
    validate(assignmentValidation.getAssignment),
    assignmentController.getAssignmentHandler
  )
  .patch(
    auth('manageAssignments'),
    validate(assignmentValidation.updateAssignment),
    assignmentController.updateAssignmentHandler
  )
  .delete(
    auth('manageAssignments'),
    validate(assignmentValidation.deleteAssignment),
    assignmentController.deleteAssignmentHandler
  );

module.exports = router;
