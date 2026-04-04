const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { studentRecordController, studentRecordValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define roles that can potentially access student records.
// More granular access control will be in the controller/service.
const studentRecordAccessRoles = ['student', 'teacher', 'staff', 'admin_education', 'admin']; // Added admin for broad access

router
  .route('/:studentId')
  .get(
    auth(studentRecordAccessRoles),
    validate(studentRecordValidations.getStudentRecord),
    studentRecordController.getStudentRecordHandler
  );

module.exports = router;
