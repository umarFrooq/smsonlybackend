const express = require('express');
const router = express.Router();
const redeemVoucherController = require('./redeem.voucher.controller');
const redeemVoucherValidation = require('./redeem.voucher.validation');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

router.route("/")
  .get(auth('manageVoucher'), validate(redeemVoucherValidation.findRedeemVoucher), redeemVoucherController.findRedeemVoucher)

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: RedeemVoucher
 *   description: Voucher mangagement
 */

/**
* @swagger
* path:
*  /redeem:
*    get:
*      summary: Get Redeem voucher
*      description: Retrieve all redeem Vouchers with filters.
*      tags: [RedeemVoucher]
*      security:
*        - bearerAuth: []
*      parameters:
*        - in: query
*          name: voucherId
*          schema:
*            type: string
*          description: voucher id
*        - in: query
*          name: userId
*          schema:
*            type: string
*          description: user id
*        - in: query
*          name: voucher
*          schema:
*            type: string
*          description: voucher
*        - in: query
*          name: to
*          schema:
*            type: date
*          description: date to
*        - in: query
*          name: from
*          schema:
*            type: date
*          description: date to
*        - in: query
*          name: status
*          schema:
*            type: string
*          description: Voucher status
*        - in: query
*          name: sortBy
*          schema:
*            type: string
*          description: sort by query in the form of field:desc/asc (ex. name:asc)
*        - in: query
*          name: limit
*          schema:
*            type: integer
*            minimum: 1
*          default: 10
*          description: Maximum number of vouchers
*        - in: query
*          name: page
*          schema:
*            type: integer
*            minimum: 1
*            default: 1
*          description: Page number
*      responses:
*        "200":
*          description: OK
*          content:
*            application/json:
*              schema:
*                type: object
*                properties:
*                  results:
*                    type: array
*                    items:
*                      $ref: '#/components/schemas/Voucher'
*                  page:
*                    type: integer
*                    example: 1
*                  limit:
*                    type: integer
*                    example: 10
*                  totalPages:
*                    type: integer
*                    example: 1
*                  totalResults:
*                    type: integer
*                    example: 1
*        "401":
*          $ref: '#/components/responses/Unauthorized'
*        "403":
*          $ref: '#/components/responses/Forbidden'
*/