const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const submissionValidation = require('./submission.validations');
const submissionController = require('./submission.controller');

const router = express.Router(); // Main router for /submissions
const assignmentSubmissionsRouter = express.Router({ mergeParams: true }); // Router for /assignments/:assignmentId/submissions

// Permissions (these should be defined in your RBAC system)
const SUBMIT_ASSIGNMENT = 'submitAssignment'; // For students
const VIEW_ASSIGNMENT_SUBMISSIONS = 'viewAssignmentSubmissions'; // For teachers/admins to see all submissions for an assignment
const GRADE_SUBMISSION = 'gradeSubmission'; // For teachers/admins

// Apply auth and schoolScope middleware.
router.use(auth());
assignmentSubmissionsRouter.use(auth());


// Route: POST /assignments/:assignmentId/submissions
// Student submits work for a specific assignment.

// Route: GET /assignments/:assignmentId/submissions
// Teacher/Admin views all submissions for a specific assignment.
assignmentSubmissionsRouter.get(
    '/',
    // Allow any authenticated user to hit the assignment-specific submissions
    // route; submissionService will enforce role-based scoping and ownership.
    auth(),
  validate(submissionValidation.getSubmissions), // Validation uses :assignmentId from params in query
  submissionController.getSubmissionsHandler // Controller will pick assignmentId from params if needed for service
);


// General routes for /submissions (not nested under assignments)

// Route: GET /submissions
// Used by:
// - Students to get their own submissions (filtered by service using user._id).
// - Admins/Teachers to query submissions with filters (e.g., by studentId, status, schoolId, gradeId).
router.get(
    '/',
    auth('viewSubmissions'),
    validate(submissionValidation.getSubmissions),
    submissionController.getSubmissionsHandler
);

// Route: GET /submissions/:submissionId
// Student views their own specific submission.
// Teacher/Admin views a specific submission.
router
    .route('/:submissionId')
    .get(
        auth('viewSubmissions'),
        validate(submissionValidation.getSubmission),
        submissionController.getSubmissionHandler
    )
    .patch(
        auth('gradeSubmission'),
        validate(submissionValidation.updateSubmission),
        submissionController.updateSubmissionHandler
    );

// Route: PATCH /submissions/:submissionId/grade
// Teacher/Admin grades a specific submission.
router.patch(
    '/:submissionId/grade',
    auth('gradeSubmission'),
    validate(submissionValidation.gradeSubmission),
    submissionController.gradeSubmissionHandler
);


module.exports = {
    mainSubmissionRouter: router, // To be mounted at /submissions
    assignmentSpecificSubmissionRouter: assignmentSubmissionsRouter // To be mounted at /assignments
};
