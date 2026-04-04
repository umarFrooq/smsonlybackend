
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const bannerValidation = require('./banner.validations');
const bannerController = require("./banner.controller")
const router = express.Router();
const Upload = require("../../middlewares/files")

router
  .route('/')
  .post(auth('manageHomePage'), Upload.uploadImages, validate(bannerValidation.createBanner), bannerController.createBanner)
  .get(validate(bannerValidation.getBanners), bannerController.getBanners);
router
  .route('/:bannerId')
  .post(auth('manageHomePage'), Upload.uploadImages, validate(bannerValidation.uploadImages), bannerController.uploadImages)
  .get(validate(bannerValidation.getBanner), bannerController.getBanner)
  .patch(auth('manageHomePage'), validate(bannerValidation.updateBanner), bannerController.updateBanner)
  .delete(auth('manageHomePage'), validate(bannerValidation.deleteBanner), bannerController.deleteBanner)
router.route("/:bannerSetId/banner-set")
  .get(bannerController.getBannerAndBannerSet)
module.exports = router;



/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Banners management and retrieval => access roleRights(Admin)
 */

/**
 * @swagger
 * path:
 *  /banners:
 *    post:
 *      summary: Create a banner
 *      description: Only admin can create banner and banners type should be sale or other.
 *      tags: [Banners]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *           application/json:
 *            schema:
 *              $ref: '#/components/schemas/Banner'
 *              required:
 *                - categoryName
 *              example:
 *                name: fake banner name
 *                type: other
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Banner'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *    get:
 *      summary: Get Paginated Banners
 *      description: Retrieve all Banners.
 *      tags: [Banners]
 *      parameters:
 *        - in: query
 *          name: name
 *          schema:
 *            type: string
 *          description: Banner name
 *        - in: query
 *          name: type
 *          schema:
 *            type: string
 *          description: Banner type should be (sale or other)
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
 *          description: Maximum number of banners
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
 *                      $ref: '#/components/schemas/Banners'
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
 *  /banners/{id}:
 *    get:
 *      summary: Get a banner
 *      description: fetching banner by id.
 *      tags: [Banners]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: banner id
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Banner'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *    patch:
 *      summary: Update a banner
 *      description: Logged in admin users can only update banners.
 *      tags: [Banners]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: banner id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                type:
 *                  type: string
 *                images:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: binary
 *                removeImages:
 *                   type: array
 *                   items:
 *                     type: string
 *              example:
 *                name: fake Banner name
 *                type: sale
 *                removeImages: ["imgeUrl1", "imgeUrl2", "imgeUrl2"]
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Banner'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *
 *    post:
 *      summary: upload banner Images
 *      description: Only admin can upload and remove Banner Images
 *      tags: [Banners]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: banner id
 *      requestBody:
 *        required: true
 *        content:
 *          multipart/form-data:
 *            schema:
 *              type: object
 *              properties:
 *                images:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: binary
 *                removeImages:
 *                   type: array
 *                   items:
 *                     type: string
 *              example:
 *                name: fake banner name
 *                images: ["imgeUrl1", "imgeUrl2", "imgeUrl2"]
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Banner'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *    delete:
 *      summary: Delete a banner
 *      description: Admin can deleted banner.
 *      tags: [Banners]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: banner id
 *      responses:
 *        "200":
 *          description: No content
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 */
