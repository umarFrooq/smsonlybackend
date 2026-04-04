const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware path
const validate = require('../../middlewares/validate'); // Assuming validate middleware path
const schoolController = require('./school.controller');
const schoolValidations = require('./school.validations');

const router = express.Router();

// Routes for managing schools - typically restricted to 'rootUser' or similar high-level admin
router
  .route('/')
  .post(
    auth('manageSchools'), // Only users with 'manageSchools' permission (e.g., rootUser)
    validate(schoolValidations.createSchool),
    schoolController.createSchoolHandler
  )
  .get(
    auth('manageSchools'), // Should rootUser also have rights to list all schools? Yes.
    validate(schoolValidations.getSchools),
    schoolController.getSchoolsHandler
  );

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router
  .route('/:schoolId')
  .get(
    auth('manageSchools'),
    validate(schoolValidations.getSchool),
    schoolController.getSchoolHandler
  )
  .patch(
    auth('manageSchools'),
    validate(schoolValidations.updateSchool),
    schoolController.updateSchoolHandler
  )
  .delete(
    auth('manageSchools'),
    validate(schoolValidations.deleteSchool),
    schoolController.deleteSchoolHandler
  );

// Upload/update school logo
// Authenticate only (no rights check) and let controller enforce role+ownership.
router.patch('/:schoolId/logo', auth(), upload.single('logo'), schoolController.updateSchoolLogoHandler);

module.exports = router;
