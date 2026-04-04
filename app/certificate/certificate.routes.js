const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const certificateValidation = require('./certificate.validation');
const certificateController = require('./certificate.controller');
const { uploadImages } = require('../../middlewares/files');

const router = express.Router();

// Apply auth and school-scope middleware
router.use(auth(), schoolScopeMiddleware);

// Permissions (hook into your RBAC)
const manageCertificates = 'manageCertificates';
const viewCertificates = 'viewCertificates';

// Template CRUD
router
  .route('/')
  .post(auth(manageCertificates), certificateController.createTemplateHandler)
  .get(auth(viewCertificates), certificateController.listTemplatesHandler);

// Generate from template (server-side rendering -> PDF)
router.route('/generate').post(auth('manageCertificates'), certificateController.generateHandler);

// Preview template or HTML as PDF
router.route('/preview').post(auth('manageCertificates'), certificateController.previewHandler);

// Get existing generated certificate record for a student (no create)
router.get('/generated', auth(viewCertificates), certificateController.getGeneratedHandler);

// Preview template as HTML (fallback/debugging)
router.route('/preview-html').post(auth('manageCertificates'), certificateController.previewHtmlHandler);

// Download generated certificate by ID
router.get('/download/:certificateId', auth(viewCertificates), certificateController.downloadGeneratedHandler);

router
  .route('/:templateId')
  .get(auth(viewCertificates), certificateController.getTemplateHandler)
  .patch(auth(manageCertificates), certificateController.updateTemplateHandler)
  .delete(auth(manageCertificates), certificateController.deleteTemplateHandler);


// Student certificate upload/update/delete (uses multer S3 middleware or local upload handler)
router
  .route('/student/:studentId')
  .post(auth(manageCertificates), uploadImages, validate(certificateValidation.uploadCertificate), certificateController.uploadCertificate)
  .put(auth(manageCertificates), uploadImages, validate(certificateValidation.updateCertificate), certificateController.updateCertificate)
  .delete(auth(manageCertificates), validate(certificateValidation.deleteCertificate), certificateController.deleteCertificate);

// Download generated certificate (PDF) for a student (or generated record)
router.get('/student/:studentId/download', auth(viewCertificates), certificateController.generateCertificate);

module.exports = router;
