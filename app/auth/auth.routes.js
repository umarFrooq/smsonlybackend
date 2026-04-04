const express = require("express");
const authController = require("./auth.controller");
const validate = require("../../middlewares/validate");
const authValidation = require("./auth.validations");
const auth = require('../../middlewares/auth');
const router = express.Router();
const passport = require("passport");
require("./facebook.google.auth");
// const facebookAuthenticate = passport.authenticate("facebook", { scope: 'email' });
const schoolService = require('../school/school.service');
router.get("/health-check", (req, res) => res.send("OK"));
router.post(
    "/registerOrLoginFromEmail",
    validate(authValidation.registerOrLoginFromEmail),
    authController.registerOrLoginFromEmail
);
// Public registration: create school and superadmin, then send verification OTP/email
router.post(
    "/public/register-school",
    validate(authValidation.publicRegisterSchool),
    authController.publicRegisterSchool
);
router.post(
    "/login-email",
    validate(authValidation.emailLogin),
    authController.emailLogin
)
router.post(
    "/login-facebook",
    validate(authValidation.emailLogin),
    authController.emailLogin
)
router.post(
    "/login-google",
    validate(authValidation.emailLogin),
    authController.emailLogin
)
router.post(
    "/send-verification-email", auth("manageProfile"),
    validate(authValidation.sendVerificationEmail),
    authController.sendVerificationEmail
);
router.post(
    "/default-address",
    auth('manageAddress'), validate(authValidation.defaultAddress),
    authController.defaultAddress
)
router.post(
    "/email-verification",
    validate(authValidation.emailVarification),
    authController.emailVarification
)
router.post(
    "/register",
    auth("manageUser"),
    validate(authValidation.register),
    authController.registerUser
);
router.post(
    "/registerSeller",
    validate(authValidation.registerSeller),
    authController.registerRequestedSeller
); 
router.post(
    "/createSeller",
    validate(authValidation.registerSeller),
    authController.createRequestedSeller
);
router.post("/login", validate(authValidation.login), authController.login);
router.post("/login/user", validate(authValidation.login), authController.userLogin);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post(
    "/refresh-tokens",
    validate(authValidation.refreshTokens),
    authController.refreshTokens
);
router.post(
    "/forgot-password",
    validate(authValidation.forgotPassword),
    authController.forgotPassword
);

router.post(
    "/reset-password",
    validate(authValidation.resetPassword),
    authController.resetPassword
);

// router.post(
//     "/send-phone-verification",
//     validate(authValidation.phoneUser),
//     authController.routeeValidation
// );

router.post(
    "/send-verification-code",
    validate(authValidation.sendVerificationCode),
    authController.sendSmsCode
);
router.post(
    "/sms-code-login",
    validate(authValidation.smsCodeVarificationLogin),
    authController.smsCodeVarificationLogin
);

router.get("/token", authController.apiKeyLogin);
router.post("/facebook-login", validate(authValidation.facebookLogin), authController.facebookLogin);
router.post("/google-login", validate(authValidation.googleLogin), authController.googleLogin);
router.post("/apple-login", validate(authValidation.appleLogin), authController.appleLogin);


// router.post("/facebook-login/seller", validate(authValidation.facebookLogin), authController.sellerFacebookLogin);
router.get("/facebook", passport.authenticate('facebook'));

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/failed', session: false }),
    authController.facebookAuthenticationAndTokenGeneration);


router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', "https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner", "https://www.googleapis.com/auth/youtube.upload"]
    }));

router.get('/google/callback', passport.authenticate('google',
    { failureRedirect: '/failed', session: false }), authController.googleAuthenticationAndTokenGeneration);
router.get("/failed", (req, res) => {
    res.send("Error while login with gmail account")
});
router.post("/current", auth('manageVideo'), authController.current);
router.route("/phone-code").post(validate(authValidation.phoneNumberCode), authController.phoneLoginCode);
router.route("/phone-verify").post(validate(authValidation.verifyPhoneNumber), authController.verifyPhoneNumber)
router.route("/admin/default-address")
    .post(auth("userManageAddress"), validate(authValidation.adminDefaultAddress), authController.adminDefaultAddress)

router.route("/verify-phone-email").post(validate(authValidation.verifyPhoneEmail), authController.verifyPhoneAndEmail)
router.route("/verify-email").post(auth('manageSeller'), validate(authValidation.verifyEmail), authController.verifyEmail)
router.route("/verify-phone").post(auth('manageSeller'), validate(authValidation.verificationOfPhone), authController.verificationOfPhone)
router.route("/resend-code").post(validate(authValidation.resendEmailCode), authController.resendEmailCode)
router.post(
    "/refresh",
    validate(authValidation.refreshTokens),
    authController.apiKeyRefreshTokens
);

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * path:
 *  /auth/register:
 *    post:
 *      summary: Register as user
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - fullname
 *                - email
 *                - password
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
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  user:
 *                    $ref: '#/components/schemas/User'
 *                  tokens:
 *                    $ref: '#/components/schemas/AuthTokens'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 */
/**
 * @swagger
 * path:
 *  /auth/registerSeller:
 *    post:
 *      summary: Register as RequestedSeller
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - fullname
 *                - email
 *                - password
 *                - phone
 *              properties:
 *                fullname:
 *                  type: string
 *                email:
 *                  type: string
 *                  format: email
 *                  description: must be unique
 *                phone:
 *                  type: string
 *                  format: phone
 *                  description: must be unique
 *                password:
 *                  type: string
 *                  format: password
 *                  minLength: 8
 *                  description: At least one number and one letter
 *              example:
 *                fullname: fake request seller name
 *                email: fakeRequestedSeller@example.com
 *                password: password1
 *                phone:  "+9230010044000"
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  user:
 *                    $ref: '#/components/schemas/User'
 *                  tokens:
 *                    $ref: '#/components/schemas/AuthTokens'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 *
 */
/**
 * @swagger
 * path:
 *  /auth/createSeller:
 *    post:
 *      summary: Register as RequestedSeller
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - fullname
 *                - email
 *                - password
 *                - phone
 *              properties:
 *                fullname:
 *                  type: string
 *                email:
 *                  type: string
 *                  format: email
 *                  description: must be unique
 *                phone:
 *                  type: string
 *                  format: phone
 *                  description: must be unique
 *                password:
 *                  type: string
 *                  format: password
 *                  minLength: 8
 *                  description: At least one number and one letter
 *              example:
 *                fullname: fake request seller name
 *                email: fakeRequestedSeller@example.com
 *                password: password1
 *                phone:  "+9230010044000"
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              example:
 *                data:
 *                  user:
 *                    wallet:
 *                      balance: 0
 *                    isEmailVarified: false
 *                    isPhoneVarified: false
 *                    userType: "local"
 *                    role: "requestedSeller"
 *                    fullname: "fake Seller"
 *                    email: "fakerequestedseller@gmail.com"
 *                    phone: "+923475172892"
 *                    createdAt: "2024-01-15T10:03:07.077Z"
 *                    updatedAt: "2024-01-15T10:03:07.077Z"
 *                    refCode: "QTUK6"
 *                    __v: 0
 *                    id: "65a502db6b63f813d4273d68"
 *                  tokens:
 *                    access:
 *                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWE1MDJkYjZiNjNmODEzZDQyNzNkNjgiLCJpYXQiOjE3MDUzMTI5ODcsImV4cCI6MTcwNTMzMjc4N30.cW2zza3LsgiUoniiI-PIpE4WalEq_Fc9mX5wVc752P8"
 *                      expires: "2024-01-15T15:33:07.237Z"
 *                    refresh:
 *                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWE1MDJkYjZiNjNmODEzZDQyNzNkNjgiLCJpYXQiOjE3MDUzMTI5ODcsImV4cCI6MTc4MzA3Mjk4N30.SfAhsVoffyVP0_JIbtRAWNV-dDuf9K0uOuOIEgeVn54"
 *                      expires: "2026-07-03T10:03:07.243Z"
 *                status: 200
 *                message: "OK"
 *              schema:
 *                $ref: '#/components/schemas/ApiResponse'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 */

/**
 * @swagger
 * path:
 *  /auth/default-address:
 *    post:
 *      summary: selecting an address from user's addresses as a default address
 *      tags: [Auth]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - addressId
 *              properties:
 *                addressId:
 *                  type: string
 *                  description: Must be the among user's addresses
 *              example:
 *                addressId: 5fdb33a2b9e7743d34443e5f
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
 *  /auth/login:
 *    post:
 *      summary: Login
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - email
 *                - password
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                password:
 *                  type: string
 *                  format: password
 *              example:
 *                email: fake@example.com
 *                password: password1
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  user:
 *                    $ref: '#/components/schemas/User'
 *                  tokens:
 *                    $ref: '#/components/schemas/AuthTokens'
 *        "401":
 *          description: Invalid email or password
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *              example:
 *                code: 401
 *                message: Invalid email or password
 */
/**
 * @swagger
 * path:
 *  /auth/logout:
 *    post:
 *      summary: Logout
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - refreshToken
 *              properties:
 *                refreshToken:
 *                  type: string
 *              example:
 *                refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *      responses:
 *        "204":
 *          description: No content
 *        "401":
 *          $ref: '#/components/responses/NotFound'
 */


/**
 * @swagger
 * path:
 *  /auth/refresh-tokens:
 *    post:
 *      summary: Refresh auth tokens
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - refreshToken
 *              properties:
 *                refreshToken:
 *                  type: string
 *              example:
 *                refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/AuthTokens'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * path:
 *  /auth/forgot-password:
 *    post:
 *      summary: Forgot password
 *      description: An email will be sent to reset password.
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - email
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *              example:
 *                email: fake@example.com
 *      responses:
 *        "204":
 *          description: No content
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * path:
 *  /auth/reset-password:
 *    post:
 *      summary: Reset password
 *      tags: [Auth]
 *      parameters:
 *        - in: query
 *          name: token
 *          required: true
 *          schema:
 *            type: string
 *          description: The reset password token
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - password
 *              properties:
 *                password:
 *                  type: string
 *                  format: password
 *                  minLength: 8
 *                  description: At least one number and one letter
 *              example:
 *                password: password1
 *      responses:
 *        "204":
 *          description: No content
 *        "401":
 *          description: Password reset failed
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *              example:
 *                code: 401
 *                message: Password reset failed
 */

/**
 * @swagger
 * path:
 *  /auth/registerOrLoginFromEmail:
 *    post:
 *      summary: login or register with email
 *      description: An email will be sent to login.
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - email
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *              example:
 *                email: fake@example.com
 *      responses:
 *        "204":
 *          description: No content
 */

/**
 * @swagger
 * path:
 *  /auth/login-email:
 *    post:
 *      summary: login via Email
 *      tags: [Auth]
 *      parameters:
 *        - in: query
 *          name: token
 *          required: true
 *          schema:
 *            type: string
 *          description: The email login token
 *
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  user:
 *                    $ref: '#/components/schemas/User'
 *                  tokens:
 *                    $ref: '#/components/schemas/AuthTokens'
 *        "401":
 *          description: Invalid email token
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *              example:
 *                code: 401
 *                message: Invalid email
 */

/**
* @swagger
* path:
*  /auth/send-verification:
*    post:
*      summary: verify Email
*      description: An email will be sent to verify email.
*      tags: [Auth]
*      security:
*        - bearerAuth: []
*      requestBody:
*        required: true
*        content:
*          application/json:
*            schema:
*              type: object
*              required:
*                - email
*              properties:
*                email:
*                  type: string
*                  format: email
*              example:
*                email: fake@example.com
*      responses:
*        "204":
*          description: No content
*        "404":
*          $ref: '#/components/responses/NotFound'
*/

/**
* @swagger
* path:
*  /auth/email-verification:
*    post:
*      summary: verify email
*      tags: [Auth]
*      parameters:
*        - in: query
*          name: token
*          required: true
*          schema:
*            type: string
*          description: The verify email token
*      responses:
*        "204":
*          description: No content
*        "401":
*          description: verify email failed
*          content:
*            application/json:
*              schema:
*                $ref: '#/components/schemas/Error'
*              example:
*                code: 401
*                message: verify email failed
*/
/**
 * @swagger
 * path:
 *  /auth/resend-code:
 *    post:
 *      summary: Email to get verification code
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - email
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *              example:
 *                email: fake@example.com
 *
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              example:
 *                data:
 *                  user:
 *                    wallet:
 *                      balance: 0
 *                    isEmailVarified: false
 *                    isPhoneVarified: false
 *                    userType: "local"
 *                    role: "requestedSeller"
 *                    fullname: "fake Seller"
 *                    email: "fakerequestedseller@gmail.com"
 *                    phone: "+923475172892"
 *                    createdAt: "2024-01-15T10:03:07.077Z"
 *                    updatedAt: "2024-01-15T10:03:07.077Z"
 *                    refCode: "QTUK6"
 *                    __v: 0
 *                    id: "65a502db6b63f813d4273d68"
 *                  tokens:
 *                    access:
 *                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWE1MDJkYjZiNjNmODEzZDQyNzNkNjgiLCJpYXQiOjE3MDUzMTI5ODcsImV4cCI6MTcwNTMzMjc4N30.cW2zza3LsgiUoniiI-PIpE4WalEq_Fc9mX5wVc752P8"
 *                      expires: "2024-01-15T15:33:07.237Z"
 *                    refresh:
 *                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWE1MDJkYjZiNjNmODEzZDQyNzNkNjgiLCJpYXQiOjE3MDUzMTI5ODcsImV4cCI6MTc4MzA3Mjk4N30.SfAhsVoffyVP0_JIbtRAWNV-dDuf9K0uOuOIEgeVn54"
 *                      expires: "2026-07-03T10:03:07.243Z"
 *                status: 200
 *                message: "OK"
 *              schema:
 *                $ref: '#/components/schemas/ApiResponse'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 */
/**
 * @swagger
 * path:
 *  /auth/verify-phone:
 *    post:
 *      summary: Resend email verification code
 *      tags: [Auth]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - phoneToken
 *              properties:
 *                phoneToken:
 *                  type: string
 *                  format: string
 *              example:
 *                phoneToken: eyJhbGciOiJSUzI1NiIsImtpZCI6ImFkNWM1ZTlmNTdjOWI2NDYzYzg1ODQ1YTA4OTlhOWQ0MTI5MmM4YzMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYmF6YWFyZ2hhciIsImF1ZCI6ImJhemFhcmdoYXIiLCJhdXRoX3RpbWUiOjE2OTU2MzQ3OTAsInVzZXJfaWQiOiJ3ZVpaVGxLcG1aTWczZ0FPR281NXJlZTVnclkyIiwic3ViIjoid2VaWlRsS3BtWk1nM2dBT0dvNTVyZWU1Z3JZMiIsImlhdCI6MTY5NTYzNDc5MCwiZXhwIjoxNjk1NjM4MzkwLCJwaG9uZV9udW1iZXIiOiIrOTIzNDA1OTA0MjAwIiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJwaG9uZSI6WyIrOTIzNDA1OTA0MjAwIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGhvbmUifX0.e1ReRdQN-pQGGKo8w1-W4UB4UF2Eu3bISehN2lee_nw4KQvi9bxZbO1WicISlwtGg9K-Yu9MCm8RkkPMtcq51yPpKJsaEUm136Q6NcPPYCIolB319zbOnG_EQZ-UATdhlM7qujZk-c4Oq6rsdg31JZ31Y69ZYd-4IIagj-d46awexD78AioFHg5gYROFOm8sFp1nPT8rI7vGzSfiiNmw-WCE1HAaRxdYjG9ladv8lLGsJNJxoTPovQS3kS15AN1TwK3g9KJbVSsJot297TOGGH4N71YeTMpMygiXnQ1w7AXM1vqCPXa83BbL9Kxb78O8GRJGqPyZajwRcuUB5kjINQ
 *
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              example:
 *                data:
 *                  user:
 *                    wallet:
 *                      balance: 0
 *                    isEmailVarified: false
 *                    isPhoneVarified: false
 *                    userType: "local"
 *                    role: "requestedSeller"
 *                    fullname: "fake Seller"
 *                    email: "fakerequestedseller@gmail.com"
 *                    phone: "+923475172892"
 *                    createdAt: "2024-01-15T10:03:07.077Z"
 *                    updatedAt: "2024-01-15T10:03:07.077Z"
 *                    refCode: "QTUK6"
 *                    __v: 0
 *                    id: "65a502db6b63f813d4273d68"
 *                  tokens:
 *                    access:
 *                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWE1MDJkYjZiNjNmODEzZDQyNzNkNjgiLCJpYXQiOjE3MDUzMTI5ODcsImV4cCI6MTcwNTMzMjc4N30.cW2zza3LsgiUoniiI-PIpE4WalEq_Fc9mX5wVc752P8"
 *                      expires: "2024-01-15T15:33:07.237Z"
 *                    refresh:
 *                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWE1MDJkYjZiNjNmODEzZDQyNzNkNjgiLCJpYXQiOjE3MDUzMTI5ODcsImV4cCI6MTc4MzA3Mjk4N30.SfAhsVoffyVP0_JIbtRAWNV-dDuf9K0uOuOIEgeVn54"
 *                      expires: "2026-07-03T10:03:07.243Z"
 *                status: 200
 *                message: "OK"
 *              schema:
 *                $ref: '#/components/schemas/ApiResponse'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 */
/**
 * @swagger
 * path:
 *  /auth/verify-email:
 *    post:
 *      summary: Resend email verification code
 *      tags: [Auth]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: emailCode
 *          required: true
 *          schema:
 *            type: string
 *          description: 17295
 *
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              example:
 *                data:
 *                  user:
 *                    wallet:
 *                      balance: 0
 *                    isEmailVarified: false
 *                    isPhoneVarified: false
 *                    userType: "local"
 *                    role: "requestedSeller"
 *                    fullname: "fake Seller"
 *                    email: "fakerequestedseller@gmail.com"
 *                    phone: "+923475172892"
 *                    createdAt: "2024-01-15T10:03:07.077Z"
 *                    updatedAt: "2024-01-15T10:03:07.077Z"
 *                    refCode: "QTUK6"
 *                    __v: 0
 *                    id: "65a502db6b63f813d4273d68"
 *                  tokens:
 *                    access:
 *                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWE1MDJkYjZiNjNmODEzZDQyNzNkNjgiLCJpYXQiOjE3MDUzMTI5ODcsImV4cCI6MTcwNTMzMjc4N30.cW2zza3LsgiUoniiI-PIpE4WalEq_Fc9mX5wVc752P8"
 *                      expires: "2024-01-15T15:33:07.237Z"
 *                    refresh:
 *                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWE1MDJkYjZiNjNmODEzZDQyNzNkNjgiLCJpYXQiOjE3MDUzMTI5ODcsImV4cCI6MTc4MzA3Mjk4N30.SfAhsVoffyVP0_JIbtRAWNV-dDuf9K0uOuOIEgeVn54"
 *                      expires: "2026-07-03T10:03:07.243Z"
 *                status: 200
 *                message: "OK"
 *              schema:
 *                $ref: '#/components/schemas/ApiResponse'
 *        "400":
 *          $ref: '#/components/responses/DuplicateEmail'
 */