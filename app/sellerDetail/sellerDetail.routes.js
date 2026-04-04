const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const sellerDetailValidation = require("./sellerDetail.validations");
const sellerDetailController = require("./sellerDetail.controller");
const router = express.Router();
const Upload = require("../../middlewares/files");

router
  .route("/")
  .post(
    auth("manageSellerDetail"),
    validate(sellerDetailValidation.createSellerDetail),
    sellerDetailController.createSellerDetail
  )
  .get(
    validate(sellerDetailValidation.getSellerDetails),
    sellerDetailController.getSellerDetails
  );
  router
  .route("/get-stores")
  .post(
    sellerDetailController.getBrands
  ) 
router
  .route("/current")
  .get(auth("manageSellerDetail"), sellerDetailController.currentSellerDetail);
router
  .route("/rrp-generator")
  .post(auth("manageSellerDetail"), sellerDetailController.rrpGenerator);
router
  .route("/rrp-parser")
  .post(
    auth("manageSellerDetail"),
    validate(sellerDetailValidation.rrpParser),
    sellerDetailController.rrpParser
  );
router.route("/generate-alias").put(auth("manageSellerDetail"), sellerDetailController.generateAlias);
router.route("/slug")
  .put(auth("manageSellerDetail"), sellerDetailController.updateSlug)
router.route("/slug/:slug")
  .get(validate(sellerDetailValidation.getSellerDetailBySlug), sellerDetailController.getSellerDetailBySlug)
router
  .route("/:sellerDetailId")
  .post(
    auth("manageSellerDetail"),
    Upload.uploadImages,
    validate(sellerDetailValidation.uploadImages),
    sellerDetailController.uploadImages
  )
  .get(
    validate(sellerDetailValidation.getSellerDetail),
    sellerDetailController.getSellerDetail
  )
  .patch(
    auth("manageSellerDetail"),
    validate(sellerDetailValidation.updateSellerDetail),
    sellerDetailController.updateSellerDetail
  )
  .delete(
    auth("manageSellerDetail"),
    validate(sellerDetailValidation.deleteSellerDetail),
    sellerDetailController.deleteSellerDetail
  );
  router
  .route("/commission/:sellerDetailId")
  .patch(auth("updateCommission"),validate(sellerDetailValidation.updateCommission), sellerDetailController.updateCommission);
router
  .route("/seller/:sellerId")
  .get(
    validate(sellerDetailValidation.getSellerDetailByUserId),
    sellerDetailController.getSellerDetailByUserId
  );
  router
  .route("/admin/:sellerDetailId/feature")
  .patch(
    auth("manageStore"),
    validate(sellerDetailValidation.featureBrand),
    sellerDetailController.featureBrand
  )
router
  .route("/admin/cost-code")
  .post(auth("manageSellerDetail"), sellerDetailController.costCodeGenerator);
router
  .route("/admin/translation")
  .post(auth("manageSellerDetail"), sellerDetailController.storeTranslation);
router
  .route("/admin/:sellerDetailId")
  .get(
    auth("manageSellerDetail"),
    validate(sellerDetailValidation.getSellerDetail),
    sellerDetailController.getSellerDetailAdmin
  );
router
    .route("/analytics/:sellerId")
    .get(
      validate(sellerDetailValidation.analytics),
      sellerDetailController.storeAnalytics
    )
router
  .route("/admin/update-storeCategory")
  .post(
    auth("manageData"),
    sellerDetailController.storeCategories
  )
module.exports = router;



/**
 * @swagger
 * tags:
 *   name: Seller Detail
 *   description: Seller Detail endpoints
 */

/**
 * @swagger
 * /sellerDetail/admin/{sellerDetailId}/feature:
 *   patch:
 *     summary: Feature a Store
 *     description: Endpoint to feature a store.
 *     tags: [Seller Detail]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerDetailId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               featured:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   feature: true
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
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
 * /sellerDetail:
 *   post:
 *     summary: Create a new seller detail
 *     description: Endpoint to create a new seller detail.
 *     tags: [Seller Detail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerDetailPayload'
 *           example:
 *             seller: "61234abcd567890def123456"
 *             market: "61234abcd567890def123456"
 *             brandName: "Example Brand"
 *             description: "Example description"
 *             city: "Example City"
 *             address: "Example Address"
 *             cityCode: "12345"
 *             lang:
 *               en:
 *                 brandName: "Example Brand"
 *                 description: "Example description"
 *     responses:
 *       200:
 *         description: Seller detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400


 *   get:
 *     summary: Get all seller details
 *     description: Endpoint to retrieve all seller details.
 *     tags: [Seller Detail]
 *     parameters:
 *       - in: query
 *         name: seller
 *         schema:
 *           type: string
 *         description: seller id.
 *       - in: query
 *         name: brandName
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
*       - in: query
 *         name: market
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by name.
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         description: Search by value.
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
 *     responses:
 *       200:
 *         description: Return all seller details
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntityError'
 * /sellerDetail/get-stores:
 *   post:
 *     summary: Get store details
 *     description: Endpoint to retrieve store details.
 *     tags: [Seller Detail]
 *     responses:
 *       200:
 *         description: Return store details
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntityError'
 * /sellerDetail/current:
 *   get:
 *     summary: Get current seller detail
 *     description: Endpoint to retrieve current seller detail.
 *     tags: [Seller Detail]
 *     responses:
 *       200:
 *         description: Return current seller detail
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 * /sellerDetail/rrp-generator:
 *   post:
 *     summary: Generate RRP
 *     description: Endpoint to generate RRP.
 *     tags: [Seller Detail]
 *     responses:
 *       200:
 *         description: Return generated RRP
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 * /sellerDetail/rrp-parser:
 *   post:
 *     summary: Parse RRP
 *     description: Endpoint to parse RRP.
 *     tags: [Seller Detail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RrpParserPayload'
 *           example:
 *             storeId: "61234abcd567890def123456"
 *     responses:
 *       200:
 *         description: Return parsed RRP
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntityError'
 * /sellerDetail/generate-alias:
 *   put:
 *     summary: Generate alias
 *     description: Endpoint to generate alias.
 *     tags: [Seller Detail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateAliasPayload'
 *           example:
 *             id: "61234abcd567890def123456"
 *             fullDb: true
 *     responses:
 *       200:
 *         description: Return generated alias
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntityError'
 * /sellerDetail/slug:
 *   put:
 *     summary: Update slug
 *     description: Endpoint to update slug.
 *     tags: [Seller Detail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSlugPayload'
 *           example:
 *             id: "61234abcd567890def123456"
 *     responses:
 *       200:
 *         description: Seller detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 * /sellerDetail/slug/{slug}:
 *   get:
 *     summary: Get seller detail by slug
 *     description: Endpoint to retrieve seller detail by slug.
 *     tags: [Seller Detail]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the seller detail to retrieve
 *     responses:
 *       200:
 *         description: Seller detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 * /sellerDetail/{sellerDetailId}:
 *   post:
 *     summary: Upload images
 *     description: Endpoint to upload images.
 *     tags: [Seller Detail]
 *     parameters:
 *       - in: path
 *         name: sellerDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the seller detail to upload images
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntityError'
 *   get:
 *     summary: Get seller detail
 *     description: Endpoint to retrieve seller detail.
 *     tags: [Seller Detail]
 *     parameters:
 *       - in: path
 *         name: sellerDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the seller detail to retrieve
 *     responses:
 *       200:
 *         description: Seller detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 *   patch:
 *     summary: Update seller detail
 *     description: Endpoint to update seller detail.
 *     tags: [Seller Detail]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the seller detail to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSellerDetailPayload'
 *           example:
 *             market: "61234abcd567890def123456"
 *             brandName: "Updated Brand"
 *             description: "Updated description"
 *             city: "Updated City"
 *             address: "Updated Address"
 *             cityCode: "67890"
 *             lang:
 *               en:
 *                 brandName: "Updated Brand"
 *                 description: "Updated description"
 *     responses:
 *       200:
 *         description: Seller detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 *   delete:
 *     summary: Delete seller detail
 *     description: Endpoint to delete seller detail.
 *     tags: [Seller Detail]
 *     parameters:
 *       - in: path
 *         name: sellerDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the seller detail to delete
 *     responses:
 *       200:
 *         description: Seller detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 * /sellerDetail/seller/{sellerId}:
 *   get:
 *     summary: Get seller detail by user ID
 *     description: Endpoint to retrieve seller detail by user ID.
 *     tags: [Seller Detail]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to retrieve seller detail
 *     responses:
 *       200:
 *         description: Seller detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 * /sellerDetail/admin/cost-code:
 *   post:
 *     summary: Generate cost code
 *     description: Endpoint to generate cost code.
 *     tags: [Seller Detail]
 *     responses:
 *       200:
 *         description: Return generated cost code
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntityError'
 * /sellerDetail/admin/translation:
 *   post:
 *     summary: Translate stores
 *     description: Endpoint to translate stores.
 *     tags: [Seller Detail]
 *     responses:
 *       200:
 *         description: Stores translated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntityError'
 * /sellerDetail/admin/{sellerDetailId}:
 *   get:
 *     summary: Get seller detail admin
 *     description: Endpoint to retrieve seller detail admin.
 *     tags: [Seller Detail]
 *     parameters:
 *       - in: path
 *         name: sellerDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the seller detail to retrieve
 *     responses:
 *       200:
 *         description: Seller detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerDetailResponse'
 *               example:
 *                 data:
 *                   images: []
 *                   country: "Pakistan"
 *                   costCode: false
 *                   approved: true
 *                   brandName: "Example Brand"
 *                   description: "Example description"
 *                   market: null
 *                   address: "Example Address"
 *                   cityCode: "12345"
 *                   city: "Example City"
 *                   seller: "654372929fd4ba2dc4751941"
 *                   createdAt: "2024-02-07T09:20:43.897Z"
 *                   updatedAt: "2024-02-07T09:20:43.897Z"
 *                   rrp: "EB411045"
 *                   slug: "example-brand"
 *                   costCenterCode: "tRyqkq3b"
 *                   alias: "ExampleBrand"
 *                   __v: 0
 *                   id: "65c34b6b24f14029fcbe9e36"
 *                 status: 200
 *                 message: "ok"
 *       400:
 *         description: Bad request. Invalid ID or action.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid ID or action."
 *               statusCode: 400
 * /sellerDetail/analytics/{sellerId}:
 *   get:
 *     summary: Get store analytics
 *     description: Endpoint to retrieve store analytics.
 *     tags: [Seller Detail]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the seller to retrieve analytics
 *     responses:
 *       200:
 *         description: Return store analytics
 *       404:
 *         description: Seller not found
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntityError'
 */