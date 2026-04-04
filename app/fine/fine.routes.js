const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import middleware
const { fineController, fineValidations } = require('.');

const router = express.Router();

// Define permissions
const manageFinesPermission = 'manageFines';
const viewFinesPermission = 'viewFines';

// Apply auth and schoolScope middleware to all fine routes
router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(
    auth(manageFinesPermission),
    validate(fineValidations.issueFine),
    fineController.issueFineHandler
  )
  .get(
    auth(viewFinesPermission),
    validate(fineValidations.getFines),
    fineController.getFinesHandler
  );

router
  .route('/:fineId')
  .get(
    auth(viewFinesPermission),
    validate(fineValidations.getFine),
    fineController.getFineHandler
  );
// Note: A general PATCH for fine details (e.g. amount, description) is missing.
// The current PATCH is only for status. If general update is needed, add:
// .patch(auth(manageFinesPermission), validate(fineValidations.updateFine), fineController.updateFineHandler)
// Also, a DELETE route for fines is missing. If needed:
// .delete(auth(manageFinesPermission), validate(fineValidations.deleteFine), fineController.deleteFineHandler);


router
  .route('/:fineId/status')
  .patch(
    auth(manageFinesPermission),
    validate(fineValidations.updateFineStatus),
    fineController.updateFineStatusHandler
  );

module.exports = router;
