const express = require("express");

const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const cartController = require("./cart.controller");
const cartValidation = require("./cart.validations");

const router = express.Router();

router
  .route("/")
  .post(
    auth("manageCart"),
    validate(cartValidation.addToCart),
    cartController.addItemToCart
  )

  .get(auth("manageCart"), cartController.getCart)
  .patch(
    auth("manageCart"),
    validate(cartValidation.removeItemFromCart),
    cartController.removeItemFromCart
  )
  .delete(auth("manageCart"), cartController.emptyCart);

router
  .route("/addPackageToCart")
  .post(
    auth("manageCart"),
    validate(cartValidation.addPackageToCart),
    cartController.addPackageToCart
  );
router
  .route("/removePackageFromCart")
  .post(
    auth("manageCart"),
    validate(cartValidation.removePackageFromCart),
    cartController.removePackageFromCart
  );
router
  .route("/unloadPackageFromCart")
  .post(
    auth("manageCart"),
    validate(cartValidation.unloadPackageFromCart),
    cartController.unloadPackageFromCart
  );
router
  .route("/admin")
  .post(
    auth("manageAdminCart"),
    validate(cartValidation.adminCart),
    cartController.adminCart
  )
  .patch(auth("manageAdminCart"), validate(cartValidation.removeItemAdmin), cartController.removeItemAdmin)
  .delete(auth("manageAdminCart"), validate(cartValidation.emptyCartAdmin), cartController.emptyCartAdmin)
router.route("/admin/payment")
  .post(auth("manageAdminCart"), validate(cartValidation.adminPartialPayment), cartController.adminPartialPayment)
router.route("/admin/payment-method")
  .post(auth("manageAdminCart"), validate(cartValidation.adminUpdatePaymentMethod), cartController.updatePaymentMethod)

router.route("/admin/:userId")
  .delete(auth("manageAdminCart"), validate(cartValidation.emptyCartAdmin), cartController.emptyCartAdmin)
  .get(auth("manageAdminCart"), validate(cartValidation.getCartAdmin), cartController.getCartAdmin)
router.route("/payment-method")
  .post(auth("manageCart"), validate(cartValidation.updatePaymentMethod), cartController.updatePaymentMethod)
router.route("/count")
  .get(auth("manageCart"), cartController.getCartCount);
router.route("/pvid")
  .get(auth("manageCart"), cartController.generatePVId)

//  router
//  .route('/deletePackageFromCart')
//  .post(auth('manageCart'),validate(cartValidation.deletePackageFromCart), cartController.deletePackageFromCart)

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart management and retrieval  => access roleRights(user)
 */

/**
 * @swagger
 * path:
 *  /cart:
 *    post:
 *      summary: add a product to cart
 *      description: Only user can add items to cart.
 *      tags: [Cart]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/addItemToCart'
 *              required:
 *                - product
 *                - quantity
 *              properties:
 *                product:
 *                  type: string
 *                quantity:
 *                  type: string
 *              example:
 *                product: 5f9fe44148c0d02180d771f1
 *                quantity: 2
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Cart
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *    get:
 *      summary: Get cart
 *      description: User Cart.
 *      tags: [Cart]
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Cart
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *
 *    patch:
 *      summary: Remove a product to cart
 *      description: Only user can add items to cart.
 *      tags: [Cart]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/removeItemFromCart'
 *              required:
 *                - product
 *              properties:
 *                product:
 *                  type: string
 *              example:
 *                $ref: '#/components/schemas/removeItemFromCart'
 *
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Cart
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *    delete:
 *      summary: empty cart
 *      description: Logged in users can empty cart.
 *      tags: [Cart]
 *      security:
 *        - bearerAuth: []
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
 * path:
 *  /cart/addPackageToCart:
 *    post:
 *      summary: add a packages to cart
 *      description: user can add packages to cart.
 *      tags: [Cart]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/addPackageToCart'
 *              required:
 *                - package
 *              properties:
 *                package:
 *                  type: string
 *              example:
 *                package: 5f9fe44148c0d02180d771f1
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Cart
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * path:
 *  /cart/removePackageFromCart:
 *    post:
 *      summary: remove a packages from cart
 *      description: user can add packages to cart.
 *      tags: [Cart]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/addPackageToCart'
 *              required:
 *                - package
 *              properties:
 *                package:
 *                  type: string
 *              example:
 *                package: 5f9fe44148c0d02180d771f1
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Cart
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /cart/unloadPackageFromCart:
 *   post:
 *     summary: Unload a package from the cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _package:
 *                 type: string
 *                 description: ID(5fe1cba9c05d6b3eb844f6e7) of the package to unload from the cart 
 *             required:
 *               - _package
 *     responses:
 *       200:
 *         description: Successfully unloaded package from the cart
 */

/**
 * @swagger
 * /cart/admin:
 *   post:
 *     summary: Add item to admin cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number of the admin
 *               product:
 *                 type: string
 *                 description: ID of the product to add to the admin cart
 *               quantity:
 *                 type: number
 *                 description: Quantity of the product to add to the admin cart
 *               fullname:
 *                 type: string
 *                 description: Full name of the admin
 *             required:
 *               - phoneNumber
 *               - product
 *               - quantity
 *           example:
 *                 phoneNumber: "+923476377893"
 *                 product: 5f9fe44148c0d02180d771f1
 *                 fullname: ali
 *                 quantity: 1
 *     responses:
 *       200:
 *         description: Successfully added item to admin cart
 *   
 *   patch:
 *     summary: Remove item from admin cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: [] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: ID of the product to remove from the admin cart
 *               _package:
 *                 type: string
 *                 description: ID of the package containing the product
 *               packageItemId:
 *                 type: string
 *                 description: ID of the item within the package
 *             required:
 *               - product
 *               - _package
 *     responses:
 *       200:
 *         description: Successfully removed item from admin cart
 *   
 *   delete:
 *     summary: Empty admin cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to empty the admin cart for
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Successfully emptied admin cart
 */

/**
 * @swagger
 * /cart/admin/payment:
 *   post:
 *     summary: Process partial payment in admin cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: boolean
 *                 description: Flag indicating if the payment is from the wallet
 *               userId:
 *                 type: string
 *                 description: ID of the user making the payment
 *               amount:
 *                 type: number
 *                 description: Amount to be paid
 *             required:
 *               - wallet
 *               - userId
 *               - amount
 *           example:
 *                userId: 5f9fe44148c0d02180d771f1
 *                wallet: true
 *                amount: 0
 *     responses:
 *       200:
 *         description: Successfully processed partial payment in admin cart
 */

/**
 * @swagger
 * /cart/admin/payment-method:
 *   post:
 *     summary: Update payment method in admin cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: boolean
 *                 description: Flag indicating if the payment method is a wallet
 *               userId:
 *                 type: string
 *                 description: ID of the user to update the payment method for
 *             required:
 *               - wallet
 *               - userId
 *           example:
 *                userId: 5f9fe44148c0d02180d771f1
 *                wallet: true
 *     responses:
 *       200:
 *         description: Successfully updated payment method in admin cart
 */

/**
 * @swagger
 * /cart/admin/{userId}:
 *   delete:
 *     summary: Empty admin cart for a specific user
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to empty the admin cart for
 *     responses:
 *       200:
 *         description: Successfully emptied admin cart for the specified user
 *   
 *   get:
 *     summary: Get admin cart for a specific user
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to get the admin cart for
 *     responses:
 *       200:
 *         description: Successfully retrieved admin cart for the specified user
 */

/**
 * @swagger
 * /cart/payment-method:
 *   post:
 *     summary: Update payment method in the user's cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet:
 *                 type: boolean
 *                 description: Flag indicating if the payment method is a wallet
 *               pin:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 4
 *                 description: User's PIN for the payment method
 *             required:
 *               - wallet
 *               - pin
 *     responses:
 *       200:
 *         description: Successfully updated payment method in the user's cart
 */

/**
 * @swagger
 * /cart/count:
 *   get:
 *     summary: Get the count of items in the user's cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the count of items in the user's cart
 */

/**
 * @swagger
 * /cart/pvid:
 *   get:
 *     summary: Generate a PV ID for the user's cart
 *     tags: [Cart]
 *     security:
 *        - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully generated a PV ID for the user's cart
 */
