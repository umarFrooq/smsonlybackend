const express = require('express');
const router = express.Router();
const voucherController = require('./voucher.controller');
const voucherValidation = require('./voucher.validation');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

router.route("/")
  .post(auth('manageVoucher'), validate(voucherValidation.createVoucher), voucherController.createVoucher)
  .get(auth('manageVoucher'), validate(voucherValidation.getVouchers), voucherController.getVouchers);
router.route("/user")
  .get(validate(voucherValidation.getUserVouchers), voucherController.getUserVouchers)
router.route("/voucher/:voucher")
  .get(validate(voucherValidation.getByVoucher), voucherController.getByVoucher);
router.route("/:voucher/redeem")
  .get(auth('voucher'), validate(voucherValidation.getByVoucher), voucherController.redeemVoucher)
router.route("/:voucherId")
  .patch(auth('manageVoucher'), validate(voucherValidation.updateVoucher), voucherController.updateVoucher)
  .get(auth('manageVoucher'), validate(voucherValidation.getVoucherById), voucherController.getVoucherById)
  .delete(auth('manageVoucher'), validate(voucherValidation.getVoucherById), voucherController.deleteVoucher)
module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Voucher
 *   description: Voucher mangagement
 */

/**
 * @swagger
 * path:
 *  /voucher:
  *    post:
 *      summary: Create a voucher
 *      description: Create a voucher
 *      tags: [Voucher]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                title:
 *                  type: string
 *                  required: true
 *                startDate:
 *                  type: string
 *                description:
 *                  type: string
 *                  required: true
 *                endDate:
 *                  type: number
 *                  required: true
 *                amount:
 *                  type: number
 *                  required: true
 *                numOfVouchers:
 *                  type: number
 *                  required: true
 *              example:
 *                title: Testing voucher
 *                startDate: 2022-01-20T09:37:28.866+00:00
 *                description: fake discription
 *                endDate: 2022-01-21T09:37:28.866+00:00
 *                amount: 100
 *                numOfVouchers: 100
 *
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Voucher'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 */

/**
* @swagger
* path:
*  /voucher:
*    get:
*      summary: Get all vouchers
*      description: Retrieve all Voucher.
*      tags: [Voucher]
*      security:
*        - bearerAuth: []
*      parameters:
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

/**
* @swagger
* path:
*  /voucher/{voucherId}:
*    get:
*      summary: Get a Voucher
*      description: fetching voucher by id.
*      tags: [Voucher]
*      security:
*        - bearerAuth: []
*      parameters:
*        - in: path
*          name: voucherId
*          required: true
*          schema:
*            type: string
*          description: voucher id
*      responses:
*        "200":
*          description: OK
*          content:
*            application/json:
*              schema:
*                 $ref: '#/components/schemas/Voucher'
*        "401":
*          $ref: '#/components/responses/Unauthorized'
*        "403":
*          $ref: '#/components/responses/Forbidden'
*        "404":
*          $ref: '#/components/responses/NotFound'
*/

/**
* @swagger
* path:
*  /voucher/{VoucherId}/redeem:
*    get:
*      summary: Redeem a voucher
*      description: redeemVoucher.
*      tags: [Voucher]
*      security:
*        - bearerAuth: []
*      parameters:
*        - in: path
*          name: voucherId
*          required: true
*          schema:
*            type: string
*          description: voucher id
*      responses:
*        "200":
*          description: OK
*          content:
*            application/json:
*              schema:
*                 $ref: '#/components/schemas/Voucher'
*        "401":
*          $ref: '#/components/responses/Unauthorized'
*        "403":
*          $ref: '#/components/responses/Forbidden'
*        "404":
*          $ref: '#/components/responses/NotFound'
*/

/**
* @swagger
* path:
*  /voucher/voucher/{Voucher}:
*    get:
*      summary: get by voucher
*      description: redeemVoucher.
*      tags: [Voucher]
*      security:
*        - bearerAuth: []
*      parameters:
*        - in: path
*          name: voucher
*          required: true
*          schema:
*            type: string
*          description: voucher
*      responses:
*        "200":
*          description: OK
*          content:
*            application/json:
*              schema:
*                 $ref: '#/components/schemas/Voucher'
*        "401":
*          $ref: '#/components/responses/Unauthorized'
*        "403":
*          $ref: '#/components/responses/Forbidden'
*        "404":
*          $ref: '#/components/responses/NotFound'
*/

/**
* @swagger
* path:
*  /voucher/voucher/{Voucher}:
*    patch:
*      summary: Update a Vouher
*      description:  Update a voucher.
*      tags: [Voucher]
*      security:
*        - bearerAuth: []
*      parameters:
*        - in: path
*          name: voucherId
*          required: true
*          schema:
*            type: string
*          description: voucherId id
*      requestBody:
*        required: true
*        content:
*          application/json:
*            schema:
*              type: object
*              properties:
*                status:
*                  type: string
*                numOfVouchers:
*                  type: integer
*                endDate:
*                  type: date
*              example:
*                status: expired
*                numOfVouchers: 1
*                endDate: 2022-01-20T09:37:28.866+00:00
*
*
*
*      responses:
*        "200":
*          description: OK
*          content:
*            application/json:
*              schema:
*                 $ref: '#/components/schemas/Voucher'
*        "401":
*          $ref: '#/components/responses/Unauthorized'
*        "403":
*          $ref: '#/components/responses/Forbidden'
*        "404":
*          $ref: '#/components/responses/NotFound'
*/
