const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const router = express.Router();
const studentController = require('./student.controller');
const quotaCheck = require('../middlewares/quotaCheck');

// Create a student record (admin/superadmin)
// Allow either platform-wide 'manageUsers' or school-scoped 'manageSchoolUsers' right
router.route('/').post(auth('manageUsers', 'manageSchoolUsers'), quotaCheck, studentController.createStudent);

// Create credentials for an existing student
// Create credentials for an existing student
router.route('/:id/create-account').patch(auth('manageUser', 'manageUsers', 'manageSchoolUsers'), studentController.createAccountForStudent);

module.exports = router;
