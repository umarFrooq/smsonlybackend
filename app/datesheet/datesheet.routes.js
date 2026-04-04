const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
// const datesheetValidation = require('./datesheet.validation');
const datesheetController = require('./datesheet.controller');

const router = express.Router();

router
    .route('/')
    .post(auth('manageDateSheets'), datesheetController.createDateSheet)
    .get(auth('getDateSheets'), datesheetController.getDateSheets);

router
    .route('/create-for-exam')
    .post(auth('manageDateSheets'), datesheetController.createDateSheetsForExam);
router.route('/download').get(auth('getDateSheets'), datesheetController.downloadDateSheetsHandler);

router
    .route('/:dateSheetId')
    .get(auth('getDateSheets'), datesheetController.getDateSheet)
    .patch(auth('manageDateSheets'), datesheetController.updateDateSheet)
    .delete(auth('manageDateSheets'), datesheetController.deleteDateSheet);

module.exports = router;
