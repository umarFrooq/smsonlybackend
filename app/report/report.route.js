const express = require("express");
const router = express.Router();
const repController = require("./report.controller");
const auth = require("../../middlewares/auth");
const repValidation = require("./report.validation");
const validate = require("../../middlewares/validate");
router
  .route("/")
  .post(
    auth("reportgeneration"),
    validate(repValidation.createReport),
    repController.createReport
  )
  .get(
    auth("manageReport"),
    validate(repValidation.getAllAdmin),
    repController.getAllAdmin
  )
  .patch(auth("manageReport"),validate(repValidation.createAction),repController.createAction)


router
  .route("/:id")
  .get( auth("manageReport"),validate(repValidation.getRepById),repController.repById)
 

module.exports = router;
/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reports 
 */

/**
 * @swagger
 * /report:
 *   post:
 *     summary: Create a new report
 *     description: Endpoint to create a new report.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReport'
 *             example:
 *               type: "QA"
 *               typeId: "60465a25e6ff0302c639e698"
 *               comment: "This is a sample comment."
 *     responses:
 *       200:
 *         description: Report action updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 action: "pending"
 *                 typeId: "6380568ded811619ac22c776"
 *                 comment: "its bad"
 *                 userId: "6380568ded811619ac22c776"
 *                 type: "Q&A"
 *                 createdAt: "2022-11-29T05:42:38.152Z"
 *                 updatedAt: "2022-11-29T05:42:38.152Z"
 *                 __v: 0
 *                 id: "63859bcd8996ea161c4b4ad1"
 *               message: "report found"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 */

/**
 * @swagger
 * /report:
 *   get:
 *     summary: Get all admin reports
 *     description: Endpoint to retrieve all admin reports.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by report type.
 *       - in: query
 *         name: typeId
 *         schema:
 *           type: string
 *         description: Filter by report type ID.
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID.
 *       - in: query
 *         name: mainRef
 *         schema:
 *           type: string
 *         description: Filter by main reference.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Limit the number of results per page.
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort the results by a specific field.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date.
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date.
 *     responses:
 *       200:
 *         description: List of reports.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 results:
 *                   - action: "pending"
 *                     typeId: "6380568ded811619ac22c776"
 *                     comment: "its bad"
 *                     userId: "6380568ded811619ac22c776"
 *                     type: "Q&A"
 *                     createdAt: "2022-11-29T05:42:38.152Z"
 *                     updatedAt: "2022-11-29T05:42:38.152Z"
 *                     __v: 0
 *                     id: "63859bcd8996ea161c4b4ad1"
 *                 page: 1
 *                 limit: 1
 *                 totalPages: 69
 *                 totalResults: 69
 *               message: "report found"
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid parameters."
 *               statusCode: 400
 */
/**
 * @swagger
 * /report/{id}:
 *   get:
 *     summary: Get a report by ID
 *     description: Endpoint to retrieve a report by its ID.
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the report to retrieve.
 *     responses:
 *       200:
 *         description: Report action updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 action: "pending"
 *                 typeId: "6380568ded811619ac22c776"
 *                 comment: "its bad"
 *                 userId: "6380568ded811619ac22c776"
 *                 type: "Q&A"
 *                 createdAt: "2022-11-29T05:42:38.152Z"
 *                 updatedAt: "2022-11-29T05:42:38.152Z"
 *                 __v: 0
 *                 id: "63859bcd8996ea161c4b4ad1"
 *               message: "report found"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 */

/**
 * @swagger
 * /report/{id}:
 *   patch:
 *     summary: Update a report action
 *     description: Endpoint to update a report action by its ID.
 *     security:
 *       - bearerAuth: []
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the report to update action.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAction'
 *             example:
 *               reportId: "63805655ed811619ac22c75e"
 *               action: "BLOCKED"
 *     responses:
 *       200:
 *         description: Report action updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 action: "pending"
 *                 typeId: "6380568ded811619ac22c776"
 *                 comment: "its bad"
 *                 userId: "6380568ded811619ac22c776"
 *                 type: "Q&A"
 *                 createdAt: "2022-11-29T05:42:38.152Z"
 *                 updatedAt: "2022-11-29T05:42:38.152Z"
 *                 __v: 0
 *                 id: "63859bcd8996ea161c4b4ad1"
 *               message: "report found"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 */