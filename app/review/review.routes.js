
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const reviewValidation = require('./review.validations');
const reviewController = require("./review.controller")
const Upload = require("../../middlewares/files");

const router = express.Router();

router
  .route('/')
  .post(auth('manageReview'), Upload.uploadImages, validate(reviewValidation.createReview), reviewController.createReview)
  .get(validate(reviewValidation.getReviews), reviewController.getReviews);

router
  .route('/:reviewId')
  .get(validate(reviewValidation.getReview), reviewController.getReview)
  .patch(auth('manageReview'),Upload.uploadImages, validate(reviewValidation.updateReview), reviewController.updateReview)
  .delete(auth('manageReview'), validate(reviewValidation.deleteReview), reviewController.deleteReview);
router.route("/:typeId/rating")
  .get(validate(reviewValidation.getRating), reviewController.getRating)
router.route("/:typeId/user")
  .get(auth('manageReview'), validate(reviewValidation.getByUserAndTypeId), reviewController.getByUserAndTypeId)
module.exports = router;



/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: reviews management and retrieval => access roleRights(user)
 */

/**
 * @swagger
 * path:
 *  /reviews:
 *    post:
 *      summary: Create a review
 *      description: Only user can create a review.
 *      tags: [Reviews]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - productId
 *                - comment
 *                - rating
 *              properties:
 *                productId:
 *                  type: string
 *                comment:
 *                  type: string
 *                  description: review's comment
 *                rating:
 *                  type: number
 *                  max: 5
 *                  description: 1 - 5
 *              example:
 *                productId: 5ebac534954b54139806c112
 *                comment: very good product
 *                rating: 5
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Review'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *
 *    get:
 *      summary: Get all reviews
 *      description:  retrieve all Reviews.
 *      tags: [Reviews]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: product
 *          schema:
 *            type: string
 *          description: Product Id
 *        - in: query
 *          name: reviewer
 *          schema:
 *            type: string
 *          description: User ID
 *        - in: query
 *          name: rating
 *          schema:
 *            type: Number
 *          description: rating  1-5
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
 *          description: Maximum number of reviews
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
 *                      $ref: '#/components/schemas/Review'
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
 *  /reviews/{id}:
 *    get:
 *      summary: Get a review
 *      description:  fetch  reviews.
 *      tags: [Reviews]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Review id
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Review'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *
 *    patch:
 *      summary: Update a review
 *      description: Logged in users can only update their own review.
 *      tags: [Reviews]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Review id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                comment:
 *                  type: string
 *                  maxLength: 200
 *                  description: must be less than 200 string length
 *                rating:
 *                  type: number
 *                  maxLength: 5
 *                  description: 1-5
 *              example:
 *                comment: updated comment
 *                rating: 5
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Review'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *
 *    delete:
 *      summary: Delete a review
 *      description: Logged in users can delete only themselves. Only admins can delete other users.
 *      tags: [Reviews]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Review id
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
