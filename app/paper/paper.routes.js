const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const  paperController  = require('./paper.controller'); // Assuming these are exported from index.js
const  paperValidations  = require('./paper.validations');
const { uploadToS3 } = require('../../config/upload-to-s3');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import middleware

const router = express.Router();

// Define permissions
const managePapersPermission = 'managePapers';
const viewPapersPermission = 'viewPapers';

// Apply auth and schoolScope middleware
// Note: uploadToS3 must come AFTER auth and schoolScope if schoolId from user context is needed for S3 path,
// or S3 path logic needs to be independent of user's direct schoolId for uploads.
// For simplicity, assuming S3 path doesn't strictly need schoolId from middleware directly for naming,
// but the overall operation is still scoped.
// If uploadToS3.single('paperFile') needs req.schoolId, middleware order is critical.
// Let's put S3 middleware per-route after validation if possible, or ensure it doesn't break scope.
// A common pattern is auth -> schoolScope -> multer(s3) -> validate -> controller.

router.use(auth(), schoolScopeMiddleware);


router
  .route('/')
  .post(
    auth(managePapersPermission),
    // uploadToS3.single('paperFile'), // multer-s3 middleware for file upload
    validate(paperValidations.uploadPaper),
    paperController.uploadPaperHandler
  )
  .get(
    auth(viewPapersPermission),
    validate(paperValidations.getPapers),
    paperController.getPapersHandler
  );

router
  .route('/:paperId')
  .get(
    auth(viewPapersPermission),
    validate(paperValidations.getPaper),
    paperController.getPaperHandler
  )
  .patch(
    auth(managePapersPermission),
    // uploadToS3.single('paperFile'), // For updating/replacing the file
    validate(paperValidations.updatePaper),
    paperController.updatePaperHandler
  )
  .delete(
    auth(managePapersPermission),
    validate(paperValidations.deletePaper),
    paperController.deletePaperHandler
  );

module.exports = router;
