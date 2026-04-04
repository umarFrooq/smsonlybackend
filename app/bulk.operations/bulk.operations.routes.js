const router = require('express').Router();
const auth = require('@/middlewares/auth');
const bulkOperationController = require('./bulk.operations.controller');
const bulkOpValidation = require('./bulk.operation.validation');
const validate = require('@/middlewares/validate');
router.route("/product-store")
  .get(auth("manageBulkOp"), validate(bulkOpValidation.productStore), bulkOperationController.productStore)

router.route("/region")
  .patch(auth("manageBulkOp"), validate(bulkOpValidation.updateProductRegions), bulkOperationController.updateProductRegions)

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Categories management and retrieval => access roleRights(Admin)
 */

/** 
 * @swagger
 * path:
 *  bulk-operation/product-store:
 *    get:
 *      summary: Add stores to product
 *      description: Add stores to product
 *      tags: [Bulk operations]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: userId
 *          schema:
 *            type: string
 *          description: 5ffecb62695986bee472617c
 *        - in: query
 *          name: images
 *          schema:
 *            type: boolean
 *          description: images 
 *        - in: query
 *          name: removeProduct
 *          schema:
 *            type: boolean
 *          description: remove product
 *        
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
 *                      $ref: '#/components/schemas/Category'
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
