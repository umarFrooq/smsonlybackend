const validate = require("@/middlewares/validate");
const express = require("express");
const router = express.Router();
const controller = require("./review.stats.controller");
const validations = require("./review.stats.validation");

router.route("/:typeId")
  .get(validate(validations.getByTypeId), controller.getByTypeId);

router.route("/:sellerDetailId/getbysellerdetail")
  .get(validate(validations.getByStoreId), controller.getByStoreId)
module.exports = router;
/**
 * @swagger
 * /review-stats/{typeId}:
 *   get:
 *     summary: Get review statistics by type ID
 *     description: abc
 *       Retrieve review statistics by type ID.
 *       This endpoint returns the review statistics for a specific review type identified by its ID.
 *     tags:
 *       - "Review Stats"
 *     parameters:
 *       - in: path
 *         name: typeId
 *         schema:
 *           type: string
 *         required: true
 *         description: "ID of the review type."
 *     responses:
 *       200:
 *         description: "Review statistics retrieved successfully."
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 data:
 *                   type: "array"
 *                   items:
 *                     type: "object"
 *                     properties:
 *                       _id:
 *                         type: "string"
 *                         example: "6182702e9350d900327dd625"
 *                       oneStar:
 *                         type: "integer"
 *                         example: 0
 *                       twoStar:
 *                         type: "integer"
 *                         example: 0
 *                       threeStar:
 *                         type: "integer"
 *                         example: 1
 *                       fourStar:
 *                         type: "integer"
 *                         example: 0
 *                       fiveStar:
 *                         type: "integer"
 *                         example: 0
 *                       orderId:
 *                         type: "string"
 *                         example: "602cb155cc4eb0d2df6544ac"
 *                       sellerDetailId:
 *                         type: "string"
 *                         example: "612f33fa07bebf0032a02e11"
 *                       sellerId:
 *                         type: "string"
 *                         example: "5ffecb62695986bee472617c"
 *                       typeId:
 *                         type: "string"
 *                         example: "602cb155cc4eb0d2df6544b1"
 *             example:
 *               data:
 *                 - _id: "6182702e9350d900327dd625"
 *                   oneStar: 0
 *                   twoStar: 0
 *                   threeStar: 1
 *                   fourStar: 0
 *                   fiveStar: 0
 *                   orderId: "602cb155cc4eb0d2df6544ac"
 *                   sellerDetailId: "612f33fa07bebf0032a02e11"
 *                   sellerId: "5ffecb62695986bee472617c"
 *                   typeId: "602cb155cc4eb0d2df6544b1"
 *               status: "200"
 *               message: ok
 */
/**
 * @swagger
 * /review-stats/{sellerDetailId}/getbysellerdetail:
 *   get:
 *     summary: Get review statistics by seller detail ID
 *     description: |
 *       Retrieve review statistics by seller detail ID.
 *       This endpoint returns the aggregated review statistics for a specific seller detail identified by its ID.
 *     tags:
 *       - "Review Stats"
 *     parameters:
 *       - in: path
 *         name: sellerDetailId
 *         schema:
 *           type: string
 *         required: true
 *         description: "ID of the seller detail."
 *     responses:
 *       200:
 *         description: "Review statistics retrieved successfully."
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 data:
 *                   type: "array"
 *                   items:
 *                     type: "object"
 *                     properties:
 *                       _id:
 *                         type: "string"
 *                         example: "6182702e9350d900327dd625"
 *                       oneStar:
 *                         type: "integer"
 *                         example: 0
 *                       twoStar:
 *                         type: "integer"
 *                         example: 0
 *                       threeStar:
 *                         type: "integer"
 *                         example: 1
 *                       fourStar:
 *                         type: "integer"
 *                         example: 0
 *                       fiveStar:
 *                         type: "integer"
 *                         example: 0
 *                       orderId:
 *                         type: "string"
 *                         example: "602cb155cc4eb0d2df6544ac"
 *                       sellerDetailId:
 *                         type: "string"
 *                         example: "612f33fa07bebf0032a02e11"
 *                       sellerId:
 *                         type: "string"
 *                         example: "5ffecb62695986bee472617c"
 *                       typeId:
 *                         type: "string"
 *                         example: "602cb155cc4eb0d2df6544b1"
 *             example:
 *               data:
 *                 - _id: "6182702e9350d900327dd625"
 *                   oneStar: 0
 *                   twoStar: 0
 *                   threeStar: 1
 *                   fourStar: 0
 *                   fiveStar: 0
 *                   orderId: "602cb155cc4eb0d2df6544ac"
 *                   sellerDetailId: "612f33fa07bebf0032a02e11"
 *                   sellerId: "5ffecb62695986bee472617c"
 *                   typeId: "602cb155cc4eb0d2df6544b1"
 *               status: "200"
 *               message: ok
 */