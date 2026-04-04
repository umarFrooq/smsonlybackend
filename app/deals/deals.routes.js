const express = require("express");
const router = express.Router();
const auth = require('../../middlewares/auth');
const dealsController = require("./deals.controller");
const dealsValidation = require("./deals.validation");
const validate = require('../../middlewares/validate');
router.route("/")
    .post(auth("manageDeals"), validate(dealsValidation.createDeal) ,dealsController.createSellerDeal)
    .get(auth("manageDeals"), validate(dealsValidation.getAdminDeal), dealsController.getAdminDeal )
router.route("/:dealId")
    .put(auth("manageDeals"), validate(dealsValidation.updateDeal), dealsController.updateSellerDeal)
    .delete(auth("manageDeals"), validate(dealsValidation.deleteDeal), dealsController.deleteDeal )
    .get(auth("manageDeals"), validate(dealsValidation.getDeal), dealsController.getDealById )

router.route("/crone/status-update")
    .post(validate(dealsValidation.updateStatuses), dealsController.updateStatuses )


/**
 * @swagger
 * tags:
 *   name: Group Buy
 *   description: Group buy management and retrieval => access roleRights(admin)
 */


/**
    * @swagger
 * /group-buy:
 *    post:
 *      description: Create group buy on product
 *      responses:
 *        '200':
 *          description: Create group buy on product
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              required:
 *                - startDate
 *                - endDate
 *                - minSubscription
 *                - maxSubscription
 *                - productId
 *              properties:
 *                startDate:
 *                  type: string
 *                endDate:
 *                  type: string
 *                minSubscription:
 *                  type: number
 *                maxSubscription:
 *                  type: number
 *                productId:
 *                  type: string
 */






/**
    * @swagger
 * /group-buy:
 *    put:
 *      description: Create group buy on product
 *      responses:
 *        '200':
 *          description: Create group buy on product
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              required:
 *                - minSubscription
 *                - maxSubscription
 *                - productId
 *              properties:
 *                minSubscription:
 *                  type: number
 *                maxSubscription:
 *                  type: number
 *                productId:
 *                  type: string
 */





module.exports = router;