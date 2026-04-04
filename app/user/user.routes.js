
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('./user.validations');
const userController = require("./user.controller")
const quotaCheck = require('../middlewares/quotaCheck');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), quotaCheck, validate(userValidation.createUser), userController.createUser)
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers);
router
  .route('/profile')
  .get(auth(), userController.getProfile)
router
  .route('/view-phone')
  .get(auth("viewPhone"), userController.getUserPhone);
router
  .route('/pin')
  .post(auth("managePin"), validate(userValidation.createWalletPin), userController.createWalletPin)
  .patch(auth("managePin"), validate(userValidation.updateWalletPin), userController.updateWalletPin)
router
  .route('/sellerHome')
  .get(auth("manageProfile"), userController.getSellerHome)
router
  .route('/requested-sellers')
  .get(auth("manageUsers"), userController.getRequestedSellers)
router
  .route('/accept-requested-seller')
  .post(auth("manageUsers"), validate(userValidation.acceptRequestedSeller), userController.acceptRequestedSeller)
router
  .route('/sellers')
  .get(auth("manageUsers"), userController.getSellers)
router.route("/ref-code")
  .get(auth("validCode"), validate(userValidation.getByRefCode), userController.getByRefCode)
router.route("/admin")
  .patch(auth("manageUsers"), validate(userValidation.addOnWallet), userController.addOnWallet)
router
  .route('/me')
  .get(auth(), userController.getProfile)
router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageProfile'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

// Get fee history for a specific user
router
  .route('/:userId/fees')
  .get(auth('viewFees'), userController.getUserFees);

router.route('/admin/:userId')
  .patch(auth('manageProfile'), validate(userValidation.updateUser), userController.updateUser)

  router.route('/status/:userId')
  .patch(auth('manageStatus'), validate(userValidation.updateStatus), userController.updateStatus)
router
  .route('/change-password')
  .put(auth("changePassword"), validate(userValidation.changePassword), userController.changePassword)
router
  .route('/refcode')
  .put(auth('manageRefCode'), validate(userValidation.updateRefCode), userController.updateRefCode)
  .post(auth('manageRefCode'), userController.updateBulkRefCode);

module.exports = router;



/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and retrieval  => access roleRights(admin)
 */

/**
 * @swagger
 * path:
 *  /users:
 *    post:
 *      summary: Create a user
 *      description: Only admins can create other users.
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *              required:
 *                - fullname
 *                - email
 *                - password
 *                - role
 *              properties:
 *                fullname:
 *                  type: string
 *                email:
 *                  type: string
 *                  format: email
 *                  description: must be unique
 *                password:
 *                  type: string
 *                  format: password
 *                  minLength: 8
 *                  description: At least one number and one letter
 *                role:
 *                   type: string
 *                   enum: [user, admin]
 *              example:
 *                fullname: fake name
 *                email: fake@example.com
 *                password: password1
 *                role: user
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/User'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *
 *    get:
 *      summary: Get all users
 *      description: Only admins can retrieve all users.
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: fullname
 *          schema:
 *            type: string
 *          description: User name
 *        - in: query
 *          name: role
 *          schema:
 *            type: string
 *          description: User role
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
 *          description: Maximum number of users
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
 *                      $ref: '#/components/schemas/User'
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
*  /users/requested-sellers:
*    get:
*      summary: Get all requested Sellers
*      description: Only admins can retrieve all request Sellers .
*      tags: [Users]
*      security:
*        - bearerAuth: []
*      parameters:
*        - in: query
*          name: fullname
*          schema:
*            type: string
*          description: User name
*        - in: query
*          name: phone
*          schema:
*            type: string
*          description: User phone
*        - in: query
*          name: email
*          schema:
*            type: string
*          description: User email
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
*          description: Maximum number of users
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
*                      $ref: '#/components/schemas/User'
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
 *  /users/accept-requested-seller:
 *    post:
 *      summary: Convert a requestedSeller to seller
 *      description: Only admins can convert a requestedSeller to seller.
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *              description: User id
 *              required:
 *                - userId
 *              properties:
 *                userId:
 *              example:
 *                userId: userId
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/User'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 */



/**
 * @swagger
 * path:
 *  /users/sellers:
 *    get:
 *      summary: Get all  Sellers
 *      description: Only admins can retrieve all requested Sellers .
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: fullname
 *          schema:
 *            type: string
 *          description: User name
 *        - in: query
 *          name: phone
 *          schema:
 *            type: string
 *          description: User phone
 *        - in: query
 *          name: email
 *          schema:
 *            type: string
 *          description: User email
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
 *          description: Maximum number of users
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
 *                      $ref: '#/components/schemas/User'
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
 *  /users/sellerHome:
 *    get:
 *      summary: Get  seller's home (will be updated later)
 *      description: Retrieve user's meta data.
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 */



/**
 * @swagger
 * path:
 *  /users/{id}:
 *    get:
 *      summary: Get a user
 *      description: Logged in users can fetch only their own user information. Only admins can fetch other users.
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: User id
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/User'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *
 *    patch:
 *      summary: Update a user
 *      description: Logged in users can only update their own information. Only admins can update other users.
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: User id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                fullname:
 *                  type: string
 *                email:
 *                  type: string
 *                  format: email
 *                  description: must be unique
 *                password:
 *                  type: string
 *                  format: password
 *                  minLength: 8
 *                  description: At least one number and one letter
 *              example:
 *                fullname: fake name
 *                email: fake@example.com
 *                password: password1
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/User'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *
 *    delete:
 *      summary: Delete a user
 *      description: Logged in users can delete only themselves. Only admins can delete other users.
 *      tags: [Users]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: User id
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
/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve user profile information based on user role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     // Define properties of user profile data here
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: User profile retrieved successfully
 *       '401':
 *         description: Unauthorized access
 *       '403':
 *         description: Forbidden access
 *       '404':
 *         description: User profile not found
 */

/**
 * @swagger
 * /users/sellers:
 *   get:
 *     summary: Get sellers
 *     description: Retrieve a list of sellers
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of sellers
 *       '401':
 *         description: Unauthorized
 */

/**
 * @swagger
 * /users/ref-code:
 *   get:
 *     summary: Get user by reference code
 *     description: Retrieve user by their reference code
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: refCode
 *         required: true
 *         schema:
 *           type: string
 *           example: ABC12345
 *     responses:
 *       '200':
 *         description: User found by reference code
 *       '401':
 *         description: Unauthorized
 */

/**
 * @swagger
 * /users/admin:
 *   patch:
 *     summary: Add funds to user's wallet
 *     description: Add funds to a user's wallet balance (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "65c5d4790e4a4b36445ab5f1"
 *               amount:
 *                 type: number
 *                 example: 100
 *               description:
 *                 type: string
 *                 example: "Adding amount to user's wallet"
 *     responses:
 *       '200':
 *         description: Funds added successfully
 *       '401':
 *         description: Unauthorized
 */

/**
 * @swagger
 * /users/refcode:
 *   put:
 *     summary: Update user's reference code
 *     description: Update user's reference code
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refCode:
 *                 type: string
 *                 example: "ABC12345"
 *     responses:
 *       '200':
 *         description: User's reference code updated successfully
 *       '401':
 *         description: Unauthorized
 *
 *   post:
 *     summary: Update bulk user reference codes
 *     description: Update bulk user reference codes
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Add schema definition for bulk operation payload if needed
 *     responses:
 *       '200':
 *         description: Bulk reference codes updated successfully
 *       '401':
 *         description: Unauthorized
 */

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change user's password
 *     description: Change user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "oldP@ssword"
 *               newPassword:
 *                 type: string
 *                 example: "newP@ssword"
 *     responses:
 *       '200':
 *         description: User's password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: number
 *                           example: 0
 *                     isEmailVarified:
 *                       type: boolean
 *                       example: false
 *                     isPhoneVarified:
 *                       type: boolean
 *                       example: false
 *                     userType:
 *                       type: string
 *                       example: "local"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     fullname:
 *                       type: string
 *                       example: "umar"
 *                     email:
 *                       type: string
 *                       example: "umer@vintegasolutions.com"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-09T07:30:01.495Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-09T12:10:15.334Z"
 *                     refCode:
 *                       type: string
 *                       example: "Do4z1"
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     id:
 *                       type: string
 *                       example: "65c5d4790e4a4b36445ab5f1"
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "ok"
 *       '401':
 *         description: Unauthorized
 */
/**
 * @swagger
 * /users/admin:
 *   patch:
 *     summary: Add funds to user's wallet
 *     description: Add funds to a user's wallet balance (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "65c5d4790e4a4b36445ab5f1"
 *               amount:
 *                 type: number
 *                 example: 100
 *               description:
 *                 type: string
 *                 example: "Adding amount to user's wallet"
 *     responses:
 *       '200':
 *         description: Funds added successfully
 *       '401':
 *         description: Unauthorized
 */