const express = require('express');
const router = express.Router();
const catalogController = require('./catalog.controller');
const catalogValidation = require('./catalog.validation');
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");

router.route("/")
  .get(catalogController.createCatalog)
router.route("/create")
  .post(auth("manageCatalogs"), validate(catalogValidation.sellerCatalog), catalogController.sellerCatalog)
module.exports = router;
/**
 * @swagger
 * path:
 *  /catalog/:
 *    get:
 *      summary: Create a new catalog
 *      tags: [Catalog]
 *      responses:
 *        '201':
 *          description: Successfully created catalog
 */


/**
 * @swagger
 * /catalog/create:
 *   post:
 *     summary: Create a seller catalog
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pageId:
 *                 type: string
 *               catalogId:
 *                 type: string
 *               businessId:
 *                 type: string
 *               fbToken:
 *                 type: string
 *                 required: true
 *     responses:
 *       '200':
 *         description: Successfully created seller catalog
 */