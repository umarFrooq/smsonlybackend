
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const sellerConfidentialDetailValidation = require('./sellerConfidentialDetail.validations');
const sellerConfidentialDetailController = require("./sellerConfidentialDetail.controller")
const router = express.Router();
const Upload = require("../../middlewares/files")

router
  .route('/')
  .post(auth('manageSellerConfidentialDetail'), validate(sellerConfidentialDetailValidation.createSellerConfidentialDetail), sellerConfidentialDetailController.createSellerConfidentialDetail)
  .get(auth('manageSellerConfidentialDetails'), validate(sellerConfidentialDetailValidation.getSellerConfidentialDetails), sellerConfidentialDetailController.getSellerConfidentialDetails);
router
  .route("/current")
  .get(auth('manageSellerConfidentialDetail'), sellerConfidentialDetailController.currentSellerConfidentialDetail);
router
  .route("/seller")
  .get(auth('manageSellerConfidentialDetails'),
    validate(sellerConfidentialDetailValidation.sellerConfidentialDetailBySeller),
    sellerConfidentialDetailController.sellerConfidentialDetailBySeller);

router.route("/generateKeys").get(auth("apiKey"), sellerConfidentialDetailController.generateApiKeys);
router
  .route('/:sellerConfidentialDetailId')
  .post(auth('manageSellerConfidentialDetail'), Upload.uploadImages, validate(sellerConfidentialDetailValidation.uploadImages), sellerConfidentialDetailController.uploadImages)
  .get(auth('manageSellerConfidentialDetail'), validate(sellerConfidentialDetailValidation.getSellerConfidentialDetail), sellerConfidentialDetailController.getSellerConfidentialDetail)
  .patch(auth('manageSellerConfidentialDetail'), validate(sellerConfidentialDetailValidation.updateSellerConfidentialDetail), sellerConfidentialDetailController.updateSellerConfidentialDetail)
  .delete(auth('manageSellerConfidentialDetail'), validate(sellerConfidentialDetailValidation.deleteSellerConfidentialDetail), sellerConfidentialDetailController.deleteSellerConfidentialDetail)

module.exports = router;

/**
 * @swagger
 * /sellerConfidentialDetail:
 *   post:
 *     summary: Create a new seller confidential detail
 *     description: Endpoint to create a new seller confidential detail.
 *     tags: [Seller Confidential Details]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerConfidentialDetailPayload'
 *           example:
 *             cnic_no: "1234567890123"
 *             seller: "60b63b47de13d03759b7016f"
 *             bankName: "ABC Bank"
 *             bankAccountTitle: "John Doe"
 *             bankAccountNumber: "1234567890"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 cnicImages: []
 *                 cnic_no: "1234567890123"
 *                 bankName: "ABC Bank"
 *                 bankAccountTitle: "John Doe"
 *                 bankAccountNumber: "1234567890"
 *                 seller: "654372929fd4ba2dc4751941"
 *                 createdAt: "2024-02-07T06:07:07.997Z"
 *                 updatedAt: "2024-02-07T06:07:07.997Z"
 *                 __v: 0
 *                 id: "65c31e0bd5c45c07f459687c"
 *               status: 200
 *               message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 *
 *   get:
 *     summary: Get all seller confidential details
 *     description: Endpoint to retrieve all seller confidential details.
 *     tags: [Seller Confidential Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: seller
 *         schema:
 *           type: string
 *         description: Seller ID.
 *       - in: query
 *         name: bankName
 *         schema:
 *           type: string
 *         description: Bank name.
 *       - in: query
 *         name: cnic_no
 *         schema:
 *           type: string
 *         description: CNIC number.
 *       - in: query
 *         name: bankAccountTitle
 *         schema:
 *           type: string
 *         description: Bank account title.
 *       - in: query
 *         name: bankAccountNumber
 *         schema:
 *           type: string
 *         description: Bank account number.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of results.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination.
 *     responses:
 *       200:
 *         description: List of seller confidential details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerConfidentialDetailList'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /sellerConfidentialDetail/{sellerConfidentialDetailId}:
 *   get:
 *     summary: Get seller confidential detail by ID
 *     description: Endpoint to retrieve a seller confidential detail by ID.
 *     tags: [Seller Confidential Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerConfidentialDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller confidential detail ID.
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 cnicImages: []
 *                 cnic_no: "1234567890123"
 *                 bankName: "ABC Bank"
 *                 bankAccountTitle: "John Doe"
 *                 bankAccountNumber: "1234567890"
 *                 seller: "654372929fd4ba2dc4751941"
 *                 createdAt: "2024-02-07T06:07:07.997Z"
 *                 updatedAt: "2024-02-07T06:07:07.997Z"
 *                 __v: 0
 *                 id: "65c31e0bd5c45c07f459687c"
 *               status: 200
 *               message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 *
 *   patch:
 *     summary: Update seller confidential detail
 *     description: Endpoint to update a seller confidential detail.
 *     tags: [Seller Confidential Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerConfidentialDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller confidential detail ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerConfidentialDetailPayload'
 *           example:
 *             cnic_no: "1234567890123"
 *             bankName: "ABC Bank"
 *             bankAccountTitle: "John Doe"
 *             bankAccountNumber: "1234567890"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 cnicImages: []
 *                 cnic_no: "1234567890123"
 *                 bankName: "ABC Bank"
 *                 bankAccountTitle: "John Doe"
 *                 bankAccountNumber: "1234567890"
 *                 seller: "654372929fd4ba2dc4751941"
 *                 createdAt: "2024-02-07T06:07:07.997Z"
 *                 updatedAt: "2024-02-07T06:07:07.997Z"
 *                 __v: 0
 *                 id: "65c31e0bd5c45c07f459687c"
 *               status: 200
 *               message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400'
 *
 *   delete:
 *     summary: Delete seller confidential detail
 *     description: Endpoint to delete a seller confidential detail.
 *     tags: [Seller Confidential Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerConfidentialDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: Seller confidential detail ID.
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 cnicImages: []
 *                 cnic_no: "1234567890123"
 *                 bankName: "ABC Bank"
 *                 bankAccountTitle: "John Doe"
 *                 bankAccountNumber: "1234567890"
 *                 seller: "654372929fd4ba2dc4751941"
 *                 createdAt: "2024-02-07T06:07:07.997Z"
 *                 updatedAt: "2024-02-07T06:07:07.997Z"
 *                 __v: 0
 *                 id: "65c31e0bd5c45c07f459687c"
 *               status: 200
 *               message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 *
 * /sellerConfidentialDetail/generateKeys:
 *   get:
 *     summary: Generate API keys
 *     description: Endpoint to generate API keys for a seller confidential detail.
 *     tags: [Seller Confidential Details]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: Generated API key.
 *                 secretKey:
 *                   type: string
 *                   description: Generated secret key.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /sellerConfidentialDetail/current:
 *   get:
 *     summary: Get current seller confidential detail
 *     description: Endpoint to retrieve the current seller confidential detail.
 *     tags: [Seller Confidential Details]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 cnicImages: []
 *                 cnic_no: "1234567890123"
 *                 bankName: "ABC Bank"
 *                 bankAccountTitle: "John Doe"
 *                 bankAccountNumber: "1234567890"
 *                 seller: "654372929fd4ba2dc4751941"
 *                 createdAt: "2024-02-07T06:07:07.997Z"
 *                 updatedAt: "2024-02-07T06:07:07.997Z"
 *                 __v: 0
 *                
 *                 apiKey: "hPvTZHluwruvH7hWFIv+fSG/P5uHwFoS"
 *                 secretKey: "N16MsDS9d1mP4Wv7+InYV9eJC3MZpzp"
 *                 id: "65c31e0bd5c45c07f459687c"
 *               status: 200
 *               message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 */
