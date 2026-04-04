
const express = require('express');

const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const walletController = require("./wallet.controller")
const walletValidation = require("./wallet.validation")

const router = express.Router();

router
    .route("/")
    .post(auth("manageWallet"), walletController.createWallet)


router
    .route("/pin")
    .post(auth("manageWallet"), validate(walletValidation.createWalletPin), walletController.createWalletPin)
    .patch(auth("manageWallet"), validate(walletValidation.updateWalletPin), walletController.updateWalletPin)

router
    .route("/forgetpin")
    .post(auth("manageWallet"), validate(walletValidation.forgetPinSmsGeneration), walletController.sendForgetPinSmsCode)
    .patch(auth("manageWallet"), validate(walletValidation.forgetPinValidator), walletController.forgetPinValidator);

module.exports = router;
/**
 * @swagger
 * /wallet:
 *   post:
 *     summary: Create a wallet
 *     description: Create a wallet for the authenticated user
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *               confirmPin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *     responses:
 *       '201':
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                       example: false
 *                     balance:
 *                       type: number
 *                       example: 0
 *                     user:
 *                       type: object
 *                       properties:
 *                         wallet:
 *                           type: object
 *                           properties:
 *                             balance:
 *                               type: number
 *                               example: 0
 *                         isEmailVarified:
 *                           type: boolean
 *                           example: false
 *                         isPhoneVarified:
 *                           type: boolean
 *                           example: false
 *                         userType:
 *                           type: string
 *                           example: local
 *                         role:
 *                           type: string
 *                           example: user
 *                         fullname:
 *                           type: string
 *                           example: umar
 *                         email:
 *                           type: string
 *                           example: umer@vintegasolutions.com
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2024-02-09T07:30:01.495Z
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2024-02-09T07:30:01.495Z
 *                         refCode:
 *                           type: string
 *                           example: Do4z1
 *                         __v:
 *                           type: integer
 *                           example: 0
 *                         id:
 *                           type: string
 *                           example: 65c5d4790e4a4b36445ab5f1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-09T10:16:07.377Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-09T10:16:07.377Z
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     id:
 *                       type: string
 *                       example: 65c5fb67a9a8d40ea00ed36f
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: wallet is created
 *       '400':
 *         description: Bad request
 */

/**
 * @swagger
 * /wallet/pin:
 *   post:
 *     summary: Set wallet PIN
 *     description: Set PIN for the user's wallet
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *               confirmPin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *     responses:
 *       '200':
 *         description: Wallet PIN set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     balance:
 *                       type: number
 *                       example: 0
 *                     user:
 *                       type: string
 *                       example: 65c5d4790e4a4b36445ab5f1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-09T10:16:07.377Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-09T10:19:52.932Z
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     pin:
 *                       type: string
 *                       example: $2a$08$Dpk6RZ0F6fUs4zxuTcH20.k401NqKZD7jGvNfd6lIr8WqCJpcXsa6
 *                     id:
 *                       type: string
 *                       example: 65c5fb67a9a8d40ea00ed36f
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: pin is set successfully
 *       '400':
 *         description: Bad request
 *   patch:
 *     summary: Update wallet PIN
 *     description: Update PIN for the user's wallet
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               newPin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *               oldPin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *               confirmPin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *     responses:
 *       '200':
 *         description: Wallet PIN set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     balance:
 *                       type: number
 *                       example: 0
 *                     user:
 *                       type: string
 *                       example: 65c5d4790e4a4b36445ab5f1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-09T10:16:07.377Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-09T10:19:52.932Z
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     pin:
 *                       type: string
 *                       example: $2a$08$Dpk6RZ0F6fUs4zxuTcH20.k401NqKZD7jGvNfd6lIr8WqCJpcXsa6
 *                     id:
 *                       type: string
 *                       example: 65c5fb67a9a8d40ea00ed36f
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: pin is set successfully
 *       '400':
 *         description: Bad request
 */

/**
 * @swagger
 * /wallet/forgetpin:
 *   post:
 *     summary: Generate SMS code for forget PIN
 *     description: Generate SMS code for resetting wallet PIN
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Wallet PIN reset code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     trackingId:
 *                       type: string
 *                       example: "0190f7e1-9bad-4678-b866-bc6710918b78"
 *                     status:
 *                       type: string
 *                       example: "Pending"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-09T10:50:13.207Z"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-09T11:00:13.206Z"
 *                     maxRetries:
 *                       type: integer
 *                       example: 0
 *                     timesTried:
 *                       type: integer
 *                       example: 0
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "responseMessages.\"WALLET_MODULE.DIGIT_CODE_IS_SENT\" + +923475172892"
 *       '400':
 *         description: Bad request
 *   patch:
 *     summary: Validate SMS code for forget PIN
 *     description: Validate SMS code and reset wallet PIN
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *               trackingId:
 *                 type: string
 *               pin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *               confirmPin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *     responses:
 *       '200':
 *         description: Wallet PIN set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     balance:
 *                       type: number
 *                       example: 0
 *                     user:
 *                       type: string
 *                       example: 65c5d4790e4a4b36445ab5f1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-09T10:16:07.377Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-09T10:19:52.932Z
 *                     __v:
 *                       type: integer
 *                       example: 0
 *                     pin:
 *                       type: string
 *                       example: $2a$08$Dpk6RZ0F6fUs4zxuTcH20.k401NqKZD7jGvNfd6lIr8WqCJpcXsa6
 *                     id:
 *                       type: string
 *                       example: 65c5fb67a9a8d40ea00ed36f
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: pin is set successfully
 *       '400':
 *         description: Bad request
 */