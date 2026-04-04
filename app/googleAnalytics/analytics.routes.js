let analyticsController = require('./analytics.controller');
const express = require("express");
const router = express.Router();
const analyticsValidation = require('./analytics.validation')
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
router.route('/').post(auth('manageGA'), validate(analyticsValidation.googleAnalyticsV2), analyticsController.googleAnalyticsV2)
router.route('/key-words').get(auth('manageGA'), validate(analyticsValidation.topKeyWords), analyticsController.topKeyWords)
router.route("/events").get(auth('manageGA'), validate(analyticsValidation.googleEventNames), analyticsController.googleEventNames)
router.route('/graph').post(auth('manageGA'), validate(analyticsValidation.googleAnalyticsV2), analyticsController.googleDimension)
router.route("/get-all").get(auth('manageGA'),analyticsController.getGoogleAnalytics)
module.exports = router;
/**
 * @swagger
 * /google-analytics:
 *   post:
 *     summary: Perform Google Analytics
 *     tags: [Google Analytics]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 format: date
 *                 description: Start date for the analytics data
 *                 example: "2020-04-03"
 *               to:
 *                 type: string
 *                 format: date
 *                 description: End date for the analytics data
 *                 example: "2023-12-31"
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the metric to be fetched from Google Analytics
 *                       example: "itemsCheckedOut"
 *     responses:
 *       200:
 *         
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 itemsCheckOut: 183
 *                 
 *               status: 200
 *               message: "ok"
 *     "401":
 *         $ref: '#/components/responses/Unauthorized'
 *     "403":
 *         $ref: '#/components/responses/Forbidden'
 */