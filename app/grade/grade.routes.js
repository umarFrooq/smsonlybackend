const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import the new middleware
const gradeController = require('./grade.controller');
const gradeValidations = require('./grade.validations');

const router = express.Router();

// Define permissions
const manageGradesPermission = 'manageGrades'; // Assumed permission for CUD operations
const viewGradesPermission = 'viewGrades'; // Assumed permission for read operations (could be same as manageGrades or more general)

// Apply auth and schoolScope middleware to all routes.
// Specific permissions will be checked per route.
router.use(auth(), schoolScopeMiddleware);


router
  .route('/')
  .post(auth(manageGradesPermission), validate(gradeValidations.createGrade), gradeController.createGradeHandler)
  .get(auth(viewGradesPermission), validate(gradeValidations.getGrades), gradeController.getGradesHandler);

router
  .route('/:gradeId')
  .get(auth(viewGradesPermission), validate(gradeValidations.getGrade), gradeController.getGradeHandler)
  .patch(auth(manageGradesPermission), validate(gradeValidations.updateGrade), gradeController.updateGradeHandler)
  .delete(auth(manageGradesPermission), validate(gradeValidations.deleteGrade), gradeController.deleteGradeHandler);

// Routes for managing sections within a grade
router
  .route('/:gradeId/sections')
  .post(auth(manageGradesPermission), validate(gradeValidations.manageSection), gradeController.addSectionHandler)
  .put(auth(manageGradesPermission), validate(gradeValidations.manageSectionsArray), gradeController.updateSectionsHandler);

router
  .route('/:gradeId/sections/:sectionName')
  .delete(auth(manageGradesPermission), validate(gradeValidations.removeSectionParams), gradeController.removeSectionHandler);

module.exports = router;
