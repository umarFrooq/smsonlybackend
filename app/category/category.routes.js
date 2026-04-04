
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const categoryValidation = require('./category.validations');
const categoryController= require("./category.controller")
const router = express.Router();
const Upload= require("../../middlewares/files")
const csvUpload = require("../../middlewares/csv");
router
  .route('/')
  .post(auth('manageCategories'), validate(categoryValidation.createCategory), categoryController.createCategory)
  .get(validate(categoryValidation.getCategories), categoryController.getCategories);
  router.route('/category-product').get(categoryController.productInCateg)
  router
  .route('/bulk-create')
  .post(auth('manageCategories'), csvUpload.CSVUpload.single('csvFile'), categoryController.creatBulkCategory);
  
  router.route('/category-product').get(categoryController.productInCateg)
  router.route("/getAllCategories").get(validate(categoryValidation.getCategories),categoryController.getAllCategories)
  router.route("/getcategorybyslug/:slug").get(validate(categoryValidation.getBySlug), categoryController.getSlugCategory )
  router
  .route('/sub-categories')
  .post(validate(categoryValidation.findSubCategories),categoryController.findSubCategories)
  .get(validate(categoryValidation.subCategories),categoryController.subCategories)
  router
  .route('/slug')
  .patch(categoryController.categorySlugUpdater)
  router.route('/video-count')
  .patch(auth('videoCount'),categoryController.addVideoCount)
  .post(auth('videoCount'),categoryController.addAllVideoCount)
  router
  .route('/translation')
  .post(auth('manageCategories'), categoryController.categoryTranslator)
  router
  .route('/tree')
  .get(auth('manageCategories'), categoryController.createCategoryTrees)
  router
  .route('/index')
  .patch(auth('manageCategories'),validate(categoryValidation.categoryIndex), categoryController.categoryIndex)
  router
  .route('/:categoryId')
  .post(auth('manageCategories'),Upload.uploadImages,validate(categoryValidation.uploadImages), categoryController.uploadImages)
  .get(validate(categoryValidation.getCategory) ,categoryController.getCategory)
  .patch(auth('manageCategories'), validate(categoryValidation.updateCategory),categoryController.updateCategory)
  .delete(auth('manageCategories'), validate(categoryValidation.deleteCategory), categoryController.deleteCategory)
  router
  .route('/map/:categoryId')
  .patch(auth('manageCategories'),validate(categoryValidation.mapAeCategories),categoryController.mapAeCategories)




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
 *  /categories:
 *    post:
 *      summary: Create a Category
 *      description: Only admin can create category.
 *      tags: [Categories]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *           application/json:
 *            schema:
 *              $ref: '#/components/schemas/CategoryPost'
 *              required:
 *                - categoryName
 *                - commission
 *              example:
 *                name: fake category name
 *                commission: 5
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/CategoryPost'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *    get:
 *      summary: Get Paginated Categories
 *      description: Retrieve all Categories.
 *      tags: [Categories]
 *      parameters:
 *        - in: query
 *          name: name
 *          schema:
 *            type: string
 *          description: category name
 *        - in: query
 *          name: commission
 *          schema:
 *            type: number
 *          description: commission 
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
 *          description: Maximum number of categories
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

/**
 * @swagger
 * path:
 *  /categories/getAllCategories:
 *    get:
 *      summary:   getAllCategories
 *      description: Retrieve all Categories.
 *      tags: [Categories]
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Category'  
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * path:
 *  /categories/{id}:
 *    get:
 *      summary: Get a category
 *      description: fetching category by id.
 *      tags: [Categories]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: category id
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Category'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *    patch:
 *      summary: Update a category
 *      description: only Admin can update the category.
 *      tags: [Categories]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: category id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                description:
 *                  type: string
 *                mainImage:
 *                   type: string
 *                   format: binary
 *                gallery:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: binary
 *                removeImages:
 *                   type: array
 *                   items:
 *                     type: string
 *              example:
 *                name: fake Category name
 *                description: fake discription
 *                example: ["imgeUrl1", "imgeUrl2", "imgeUrl2"]
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Category'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *
 *    post:
 *      summary: upload category Images
 *      description: Only admin can update categories pics.
 *      tags: [Categories]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: category id
 *      requestBody:
 *        required: true
 *        content:
 *          multipart/form-data:
 *            schema:
 *              type: object
 *              properties:
 *                mainImage:
 *                   type: string
 *                   format: binary
 *                gallery:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: binary
 *                removeImages:
 *                   type: array
 *                   items:
 *                     type: string
 *              example:
 *                name: fake Category name
 *                example: ["imgeUrl1", "imgeUrl2", "imgeUrl2"]
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Category'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *    delete:
 *      summary: Delete a category
 *      description: Logged in users can delete and Only Admin can delete their categories.
 *      tags: [Categories]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Category id
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
