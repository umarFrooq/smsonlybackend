const express = require('express');
const router = express.Router();
const rrpController = require('./rrp.controller');
const rrpValidator = require('./rrp.validations');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

router.route('/')
  .get(auth('rrpManage'), validate(rrpValidator.getAllRRP), rrpController.getAllRRP)
module.exports = router;
/**
 * @swagger
 * tags:
 *   name: RRP
 *   description: RRP 
 */

/**
 * @swagger
 * /rrp:
 *   get:
 *     summary: Get RRP data
 *     description: Endpoint to retrieve RRP data.
 *     security:
 *       - bearerAuth: []
 *     tags: [RRP]
 *     parameters:
 *       - in: query
 *         name: seller
 *         schema:
 *           type: string
 *         description: Seller ID.
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *         description: Customer ID.
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort records.
 *       - in: query
 *         name: rrp
 *         schema:
 *           type: string
 *         description: RRP ID.
 *       - in: query
 *         name: creditBack
 *         schema:
 *           type: string
 *         description: Indicates if credit is given back.
 *     responses:
 *       200:
 *         description: RRP data retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "responseMessages.ok"
 *               data:
 *                 results:
 *                   - rrpCredit: 200
 *                     creditBack: true
 *                     rrpAmount: 18000
 *                     seller: "5ffecb62695986bee472617c"
 *                     sellerDetail: "612f33fa07bebf0032a02e11"
 *                     rrp: "Bhy72"
 *                     customer: "5ffeef45160d53c411ff3309"
 *                     order: "61af57dd65a84d0e1456a960"
 *                     __v: 0
 *                     id: "61af57e765a84d0e1456a987"
 *                   - rrpCredit: 200
 *                     creditBack: true
 *                     rrpAmount: 22400
 *                     seller: "5ffecb62695986bee472617c"
 *                     sellerDetail: "612f33fa07bebf0032a02e11"
 *                     rrp: "SH-010"
 *                     customer: "60056389714cad29ac1a8082"
 *                     order: "61b1b1309c5c9b002fa788ad"
 *                     __v: 0
 *                     id: "61b1b1329c5c9b002fa788e4"
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 totalResults: 8
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid parameters."
 *               statusCode: 400
 */