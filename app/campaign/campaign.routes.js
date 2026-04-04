const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const router = express.Router();
const campaignValidation = require('./campaign.validation');
const campaignController = require('./campaign.controller');


router
.route('/admin')
.post(auth('managePromotion'), validate(campaignValidation.sendPromotionalEmail), campaignController.promotionalEmail)
.get(auth('managePromotion'),validate(campaignValidation.getPromotionalEmails), campaignController.getPromotionalEmails)

router
.route('/admin/:id')
.get(auth('managePromotion'), validate(campaignValidation.getEmailById), campaignController.getEmailById)

module.exports = router

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Campaign management and retrieval => access roleRights(Admin)
 */

/**
 * @swagger
 * path:
 *  /promotional-email/admin:
 *    post:
 *      summary: Send promotional email
 *      description: Only admin can send promotional email.
 *      tags: [Campaigns]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *           application/json:
 *            schema:
 *              $ref: '#/components/schemas/Campaign'
 *            required:
 *              - type
 *              - body
 *              - subject
 *            example:
 *              body: fake body
 *              type: user
 *              userId: 65f926da5fe94b38f05bb98f
 *              subject: fake subject
 *      responses:
 *        "201":
 *          description: Sent
 *          content:
 *            application/json:
 *              schema:
 *                 type: object
 *                 properties:
 *                    message:
 *                      type: string
 *                    status:
 *                      type: number
 *                    data:
 *                      type: object
 *                 example:
 *                    message: OK
 *                    status: 200
 *                    data:
 *                      id: 65f926da5fe94b38f05bb98f
 *                      subject: Ramadan Mubarak
 *                      type: user
 *                      body: fake body
 *                      totalUsers: 1
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *    get:
 *      summary: Get Paginated Banners
 *      description: Retrieve all Banners.
 *      tags: [Campaigns]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: type
 *          schema:
 *            type: string
 *          description: Role
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
 *          default: 1
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
 *  /promotional-email/admin/{id}:
 *    get:
 *      summary: Get a campaign
 *      description: fetching campaign by id.
 *      tags: [Campaigns]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Campaign id
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 type: object
 *                 properties:
 *                    message:
 *                      type: string
 *                    status:
 *                      type: number
 *                    data:
 *                      type: object
 *                 example:
 *                    message: OK
 *                    status: 200
 *                    data:
 *                      id: 65f926da5fe94b38f05bb98f
 *                      subject: Ramadan Mubarak
 *                      type: user
 *                      body: fake body
 *                      totalUsers: 1                
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 */


