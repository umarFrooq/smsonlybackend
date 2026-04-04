const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const syllabusValidation = require('./syllabus.validation');
const syllabusController = require('./syllabus.controller');

const router = express.Router();

// Authenticate and attach school scope for scoped users (superadmin/admin/teacher/student)
router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(auth('manageSyllabus'), validate(syllabusValidation.createSyllabus), syllabusController.createSyllabusHandler)
  .get(auth('viewSyllabus', 'viewOwnSyllabus'), validate(syllabusValidation.getSyllabi), syllabusController.getSyllabiHandler);

router
  .route('/:syllabusId')
  .get(auth('viewSyllabus', 'viewOwnSyllabus'), validate(syllabusValidation.getSyllabus), syllabusController.getSyllabusHandler)
  .patch(auth('manageSyllabus'), validate(syllabusValidation.updateSyllabus), syllabusController.updateSyllabusHandler)
  .delete(auth('manageSyllabus'), validate(syllabusValidation.deleteSyllabus), syllabusController.deleteSyllabusHandler);

router.route('/grade/:gradeId/subject/:subjectId/timeline').get(auth('viewSyllabus', 'viewOwnSyllabus'), syllabusController.getTimelineHandler);

module.exports = router;
