const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
// const resultValidation = require('./result.validation');
const resultController = require('./result.controller');

const schoolScope = require('../middlewares/schoolScope.middleware');
const router = express.Router();

router
    .route('/')
    .post(auth('manageResults'), schoolScope, resultController.createResult)
    .get(auth('getResults'), schoolScope, resultController.getResults);

router
    .route('/bulk')
    .post(auth('manageResults'), schoolScope, resultController.bulkUpdateResults);

router
    .route('/announce')
    .post(auth('manageResults'), schoolScope, resultController.announceResults);

router
    .route('/:resultId')
    .get(auth('getResults'), schoolScope, resultController.getResult)
    .patch(auth('manageResults'), schoolScope, resultController.updateResult)
    .delete(auth('manageResults'), schoolScope, resultController.deleteResult);

module.exports = router;
