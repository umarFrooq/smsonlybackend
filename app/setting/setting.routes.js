
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const tableValidation = require('./setting.validation');
const tableController = require("./setting.controller")

const router = express.Router();

router
  .route('/')
  .post(auth("manageSetting"),validate(tableValidation.createTable),tableController.createTable)
  .get(auth("manageSetting"),validate(tableValidation.filterTable),tableController.filterTable)
  router.route('/prices')
.get(auth("sellerSetting"),validate(tableValidation.getTaxes),tableController.getTaxes)
  router.route('/:tableId').get(auth("manageSetting"),validate(tableValidation.getTableById),tableController.getTableById)
  .patch(auth("manageSetting"),validate(tableValidation.updateTableById),tableController.updateTableById)
 .delete(auth("manageSetting"),validate(tableValidation.deleteTableById),tableController.deleteTableById)

module.exports = router;
// /**
//  * @swagger
//  * tags:
//  *   name: setting Ap
//  *   description:  Setting Api
//  */

// /**
//  * @swagger
//  * /setting:
//  *   post:
//  *     summary: Create table
//  *     description: Create a new table.
//  *     tags: [setting]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: key
//  *         description: Key parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: AMOUNT
//  *         description: KeyValue parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: "%"
//  *         description: Unit parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: amount
//  *         description: Label parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: gold amount
//  *         description: Description parameter for filtering.
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               key:
//  *                 type: string
//  *               keyValue:
//  *                 type: string
//  *               unit:
//  *                 type: string
//  *               label:
//  *                 type: string
//  *               description:
//  *                 type: string
//  *             example:
//  *               key: amout
//  *               keyValue: 100,
//  *               unit: "%"
//  *               label: amount
//  *               description: This is gold amount
//  *     responses:
//  *       '201':
//  *         description: Created
//  *         content:
//  *           application/json:
//  *             example:
//  *               data:
//  *                 mtable:
//  *                   key: "test"
//  *                   keyValue: "testing value"
//  *                   unit: "kg"
//  *                   label: "test"
//  *                   description: "testing testing"
//  *                   createdAt: "2023-12-19T10:29:47.300Z"
//  *                   updatedAt: "2023-12-19T10:37:57.496Z"
//  *                   __v: 0
//  *                   id: "6581709ba6408cab2c7baf76"
//  *               status: 200
//  *               message: "ok"
//  */

// /**
//  * @swagger
//  * /setting:
//  *   get:
//  *     summary: Filter Table
//  *     description: Filter tables.
//  *     tags: [setting]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: key
//  *         description: Key parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: label
//  *         description: Label parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: unit
//  *         description: Unit parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: keyValue
//  *         description: KeyValue parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: active
//  *         description: Active parameter for filtering.
//  *         schema:
//  *           type: boolean
//  *       - in: query
//  *         name: name
//  *         description: Name parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: value
//  *         description: Value parameter for filtering.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: sortBy
//  *         description: SortBy parameter for sorting.
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: to
//  *         description: To parameter for date filtering.
//  *         schema:
//  *           type: string
//  *           format: date
//  *       - in: query
//  *         name: from
//  *         description: From parameter for date filtering.
//  *         schema:
//  *           type: string
//  *           format: date
//  *       - in: query
//  *         name: limit
//  *         description: Limit parameter for pagination.
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: page
//  *         description: Page parameter for pagination.
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       '201':
//  *         description: Successfully filtered tables
//  *         content:
//  *           application/json:
//  *             example:
//  *               data:
//  *                 - key: "test"
//  *                   keyValue: "testing value"
//  *                   unit: "kg"
//  *                   label: "test"
//  *                   description: "testing testing"
//  *                   createdAt: "2023-12-19T10:29:47.300Z"
//  *                   updatedAt: "2023-12-19T10:37:57.496Z"
//  *                   __v: 0
//  *                   id: "6581709ba6408cab2c7baf76"
//  *               status: 200
//  *               message: "ok"
//  * '/setting/{tableId}':
//  *     parameters:
//  *       - in: path
//  *         name: tableId
//  *         required: true
//  *         description: ID of the table
//  *         schema:
//  *           type: string
//  *     get:
//  *       summary: Get table by Id
//  *       description: Get table by Id.
//  *       tags: [setting]
//  *       security:
//  *         - bearerAuth: []
//  *       responses:
//  *         '201':
//  *           description: Successfully retrieved table by Id
//  *           content:
//  *             application/json:
//  *               example:
//  *                 data:
//  *                   key: "test"
//  *                   keyValue: "testing value"
//  *                   unit: "kg"
//  *                   label: "test"
//  *                   description: "testing testing"
//  *                   createdAt: "2023-12-19T10:29:47.300Z"
//  *                   updatedAt: "2023-12-19T10:37:57.496Z"
//  *                   __v: 0
//  *                   id: "6581709ba6408cab2c7baf76"
//  *                 status: 200
//  *                 message: "ok"
//  *     patch:
//  *       summary: Update setting
//  *       description: Admin and super admin can change the setting.
//  *       tags: [setting]
//  *       security:
//  *         - bearerAuth: []
//  *       parameters:
//  *         - in: path
//  *           name: tableId
//  *           required: true
//  *           description: ID of the table to update
//  *           schema:
//  *             type: string
//  *       requestBody:
//  *         required: true
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 key:
//  *                   type: string
//  *                 keyValue:
//  *                   type: string
//  *                 unit:
//  *                   type: string
//  *                 label:
//  *                   type: string
//  *                 description:
//  *                   type: string
//  *               example:
//  *                 key: amout
//  *                 keyValue: 100,
//  *                 unit: "%"
//  *                 label: amount
//  *                 description: This is gold amount
//  *       responses:
//  *         '201':
//  *           description: Successfully updated setting
//  *           content:
//  *             application/json:
//  *               example:
//  *                 data:
//  *                   key: "test"
//  *                   keyValue: "updated value"
//  *                   unit: "kg"
//  *                   label: "test"
//  *                   description: "updated description"
//  *                   createdAt: "2023-12-19T10:29:47.300Z"
//  *                   updatedAt: "2023-12-19T10:37:57.496Z"
//  *                   __v: 0
//  *                   id: "6581709ba6408cab2c7baf76"
//  *                 status: 200
//  *                 message: "ok"
//  *     delete:
//  *       summary: Delete table by Id
//  *       description: Delete table by Id.
//  *       tags: [setting]
//  *       security:
//  *         - bearerAuth: []
//  *       parameters:
//  *         - in: path
//  *           name: tableId
//  *           required: true
//  *           description: ID of the table to delete
//  *           schema:
//  *             type: string
//  *       responses:
//  *         '201':
//  *           description: Successfully deleted table by Id
//  *           content:
//  *             application/json:
//  *               example:
//  *                 data:
//  *                   key: "test"
//  *                   keyValue: "deleted value"
//  *                   unit: "kg"
//  *                   label: "test"
//  *                   description: "deleted description"
//  *                   createdAt: "2023-12-19T10:29:47.300Z"
//  *                   updatedAt: "2023-12-19T10:37:57.496Z"
//  *                   __v: 0
//  *                   id: "6581709ba6408cab2c7baf76"
//  *                 status: 200
//  *                 message: "ok"
//  */



/**
 * @swagger
 * /setting:
 *   post:
 *     summary: Create a master table
 *     description: Create a new master table.
 *     tags: [Setting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTableRequest'
 *     responses:
 *       '200':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: boolean
 *                       example: true
 *                     dataType:
 *                       type: string
 *                       example: "string"
 *                     key:
 *                       type: string
 *                       example: "PRICE"
 *                     label:
 *                       type: string
 *                       example: "price"
 *                     keyValue:
 *                       type: string
 *                       example: "200"
 *                     description:
 *                       type: string
 *                       example: "testing testing"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-29T07:21:58.162Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-29T07:21:58.162Z"
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     id:
 *                       type: string
 *                       example: "65e0309610a07a1a246be1f9"
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "OK"
 */

/**
 * @swagger
 * /setting:
 *   get:
 *     summary: Filter master table
 *     description: Filter master tables.
 *     tags: [Setting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         description: Key parameter for filtering.
 *         schema:
 *           type: string
 *       - in: query
 *         name: keyValue
 *         description: KeyValue parameter for filtering.
 *         schema:
 *           type: string
 *       - in: query
 *         name: to
 *         description: To parameter for date filtering.
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: from
 *         description: From parameter for date filtering.
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: label
 *         description: Label parameter for filtering.
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         description: Active parameter for filtering.
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: unit
 *         description: Unit parameter for filtering.
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         description: Name parameter for search filtering.
 *         schema:
 *           type: string
 *       - in: query
 *         name: value
 *         description: Value parameter for search filtering.
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         description: SortBy parameter for sorting.
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         description: Limit parameter for pagination.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         description: Page parameter for pagination.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successfully filtered tables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterTableResponse'
 */

/**
 * @swagger
 * /setting/{tableId}:
 *   get:
 *     summary: Get master table by Id
 *     description: Get master table by Id.
 *     tags: [Setting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         description: ID of the master table
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: boolean
 *                       example: true
 *                     dataType:
 *                       type: string
 *                       example: "string"
 *                     key:
 *                       type: string
 *                       example: "PRICE"
 *                     label:
 *                       type: string
 *                       example: "price"
 *                     keyValue:
 *                       type: string
 *                       example: "200"
 *                     description:
 *                       type: string
 *                       example: "testing testing"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-29T07:21:58.162Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-29T07:21:58.162Z"
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     id:
 *                       type: string
 *                       example: "65e0309610a07a1a246be1f9"
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "OK"
 *   patch:
 *     summary: Update master table by Id
 *     description: Admin and super admin can change the master table.
 *     tags: [Setting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         description: ID of the master table to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTableByIdRequest'
 *     responses:
 *       '200':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: boolean
 *                       example: true
 *                     dataType:
 *                       type: string
 *                       example: "string"
 *                     key:
 *                       type: string
 *                       example: "PRICE"
 *                     label:
 *                       type: string
 *                       example: "price"
 *                     keyValue:
 *                       type: string
 *                       example: "200"
 *                     description:
 *                       type: string
 *                       example: "testing testing"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-29T07:21:58.162Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-29T07:21:58.162Z"
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     id:
 *                       type: string
 *                       example: "65e0309610a07a1a246be1f9"
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "OK"
 *   delete:
 *     summary: Delete master table by Id
 *     description: Delete master table by Id.
 *     tags: [Setting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         description: ID of the master table to delete
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: boolean
 *                       example: true
 *                     dataType:
 *                       type: string
 *                       example: "string"
 *                     key:
 *                       type: string
 *                       example: "PRICE"
 *                     label:
 *                       type: string
 *                       example: "price"
 *                     keyValue:
 *                       type: string
 *                       example: "200"
 *                     description:
 *                       type: string
 *                       example: "testing testing"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-29T07:21:58.162Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-29T07:21:58.162Z"
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     id:
 *                       type: string
 *                       example: "65e0309610a07a1a246be1f9"
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "OK"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTableRequest:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         keyValue:
 *           type: string
 *         active:
 *           type: boolean
 *         label:
 *           type: string
 *         description:
 *           type: string
 *         unit:
 *           type: string
 *         dataType:
 *           type: string
 *           enum: [STRING, NUMBER, BOOLEAN, DATE]
 *       required:
 *         - key
 *         - keyValue
 *         - label
 *         - description
 *     CreateTableResponse:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         keyValue:
 *           type: string
 *         unit:
 *           type: string
 *         label:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         __v:
 *           type: integer
 *         id:
 *           type: string
 *       required:
 *         - key
 *         - keyValue
 *         - label
 *         - description
 *         - createdAt
 *         - updatedAt
 *         - __v
 *         - id
 *     FilterTableResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreateTableResponse'
 *         status:
 *           type: integer
 *         message:
 *           type: string
 *       required:
 *         - data
 *         - status
 *         - message
 *     GetTableByIdResponse:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         keyValue:
 *           type: string
 *         unit:
 *           type: string
 *         label:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         __v:
 *           type: integer
 *         id:
 *           type: string
 *       required:
 *         - key
 *         - keyValue
 *         - label
 *         - description
 *         - createdAt
 *         - updatedAt
 *         - __v
 *         - id
 *     UpdateTableByIdRequest:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         keyValue:
 *           type: string
 *         active:
 *           type: boolean
 *         label:
 *           type: string
 *         description:
 *           type: string
 *         unit:
 *           type: string
 *         dataType:
 *           type: string
 *           enum: [STRING, NUMBER, BOOLEAN, DATE]
 *     UpdateTableByIdResponse:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         keyValue:
 *           type: string
 *         unit:
 *           type: string
 *         label:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         __v:
 *           type: integer
 *         id:
 *           type: string
 *       required:
 *         - key
 *         - keyValue
 *         - label
 *         - description
 *         - createdAt
 *         - updatedAt
 *         - __v
 *         - id
 *     DeleteTableByIdResponse:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         keyValue:
 *           type: string
 *         unit:
 *           type: string
 *         label:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         __v:
 *           type: integer
 *         id:
 *           type: string
 *       required:
 *         - key
 *         - keyValue
 *         - label
 *         - description
 *         - createdAt
 *         - updatedAt
 *         - __v
 *         - id
 */
