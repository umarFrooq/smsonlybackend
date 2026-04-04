const express = require("express");

const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const addressController = require("./address.controller");
const addressValidation = require("./address.validations");

const router = express.Router();

router
  .route("/")
  .post(
    auth("manageAddress"),
    validate(addressValidation.createAddress),
    addressController.createAddress
  )
  .get(auth("manageAddress"), addressController.getAllAddresses);
router
  .route("/admin/:phone")
  .get(
    auth("userManageAddress"),
    validate(addressValidation.getUserAddresses),
    addressController.getUserAddresses
  )
  .post(
    auth("userManageAddress"),
    validate(addressValidation.createAsAdmin),
    addressController.createAsAdmin
  )
  .patch(
    auth("userManageAddress"),
    validate(addressValidation.updateAsAdmin),
    addressController.updateAsAdmin
  );

router
  .route("/:addressId")
  .patch(
    auth("manageAddress"),
    validate(addressValidation.updateAddress),
    addressController.updateAddress
  )
  .delete(
    auth("manageAddress"),
    validate(addressValidation.deleteAddress),
    addressController.deleteAddress
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Address
 *   description: address  management and retrieval => access roleRights(supplier)
 */

/**
 * @swagger
 * path:
 *  /address:
 *    post:
 *      summary: Create user Address
 *      description: Only supplier can create product.
 *      tags: [Address]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/createAddress'
 *              required:
 *                - fullname
 *                - phone
 *                - province
 *                - city
 *                - city_code
 *                - address
 *                - addressType
 *                - area
 *              properties:
 *                fullname:
 *                  type: string
 *                phone:
 *                  type: string
 *                  format: phone no
 *                  description: must be phone no
 *                city:
 *                  type: string
 *                  description: must be a city
 *                addressType:
 *                   type: string
 *                   enum: [home, office]
 *                province:
 *                  type: string
 *                address:
 *                  type: string
 *                area:
 *                  type: string
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Address'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *    get:
 *      summary:   getAllAddresses
 *      description: Retrieve all Categories.
 *      tags: [Address]
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Address'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * path:
 *  /address/cities:
 *    get:
 *      summary:   getAllCities
 *      description: Retrieve all cities.
 *      tags: [Address]
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/City'
 */
/**
 * @swagger
 * path:
 *  /address/admin/{phone}:
 *    get:
 *      summary: Get Address by admin
 *      description: Get Addresses.
 *      tags: [Address]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: phone
 *          required: true
 *          schema:
 *            type: string
 *          description: Phone number
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              example:
 *                data:
 *                  - addressType: "home"
 *                    localType: "local"
 *                    fullname: "umar"
 *                    phone: "+923475172892"
 *                    province: "punjab"
 *                    address: "rawalpindi chandni chowk"
 *                    city: "punjab"
 *                    city_code: "ISB"
 *                    country: "pakistan"
 *                    state: " d"
 *                    user: "6019008fdaa2970414a6f31a"
 *                    createdAt: "2023-11-02T09:35:55.231Z"
 *                    updatedAt: "2023-11-02T09:35:55.231Z"
 *                    __v: 0
 *                    id: "65436d7b9fd4ba2dc475193e"
 *                  - addressType: "home"
 *                    localType: "local"
 *                    fullname: "test Address"
 *                    phone: "+923018324487"
 *                    province: "+923018324487"
 *                    address: "+923018324487"
 *                    city: "Islamabad"
 *                    city_code: "ISB"
 *                    country: "+923018324487"
 *                    state: "+923018324487"
 *                    user: "6019008fdaa2970414a6f31a"
 *                    createdAt: "2023-08-30T07:33:24.748Z"
 *                    updatedAt: "2023-08-30T07:33:24.748Z"
 *                    __v: 0
 *                    id: "64eef0c4316bfe309c4b04dd"
 *                  - addressType: "home"
 *                    localType: "local"
 *                    fullname: "Asad Ahmed"
 *                    phone: "03015396667"
 *                    city: "Rawalpindi"
 *                    city_code: "RWP"
 *                    address: "Madina Tower 4th road "
 *                    user: "6019008fdaa2970414a6f31a"
 *                    createdAt: "2021-11-29T06:02:42.346Z"
 *                    updatedAt: "2021-11-29T06:02:42.346Z"
 *                    __v: 0
 *                    id: "61a46d02839aae002f9d4068"
 *                  - addressType: "home"
 *                    localType: "local"
 *                    fullname: "Asad Ahmed"
 *                    phone: "03015396667"
 *                    city: "abc"
 *                    address: "Madina Tower 4th road"
 *                    
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *    post:
 *      summary: Create Address as admin
 *      description: Create a new address.
 *      tags: [Address]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: phone
 *          required: true
 *          schema:
 *            type: string
 *          description: Phone number
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateAddressInput'
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              example:
 *                data:
 *                  addressType: "home"
 *                  localType: "international"
 *                  address: "margalla town phase 1"
 *                  city: "Islamabad"
 *                  city_code: "ISB"
 *                  fullname: "supplier"
 *                  phone: "+923015396667"
 *                  province: "Pakistan"
 *                  user: "60c71bde6f0fe647a5476e79"
 *                  createdAt: "2023-08-30T06:30:18.064Z"
 *                  updatedAt: "2023-08-30T06:36:55.137Z"
 *                  __v: 0
 *                  id: "64eee1fa12580508c4eae5f5"
 *                status: 200
 *                message: "OK"
 *              schema:
 *                $ref: '#/components/schemas/ApiResponse'
 *        "400":
 *          $ref: '#/components/responses/BadRequest'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *
 *    patch:
 *      summary: Update Address as admin
 *      description: Update an existing address.
 *      tags: [Address]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: phone
 *          required: true
 *          schema:
 *            type: string
 *          description: Phone number
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/UpdateAddressInput'
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              example:
 *                data:
 *                  addressType: "home"
 *                  localType: "international"
 *                  address: "margalla town phase 1"
 *                  city: "Islamabad"
 *                  city_code: "ISB"
 *                  fullname: "supplier"
 *                  phone: "+923015396667"
 *                  province: "Pakistan"
 *                  user: "60c71bde6f0fe647a5476e79"
 *                  createdAt: "2023-08-30T06:30:18.064Z"
 *                  updatedAt: "2023-08-30T06:36:55.137Z"
 *                  __v: 0
 *                  id: "64eee1fa12580508c4eae5f5"
 *                status: 200
 *                message: "OK"
 *              schema:
 *                $ref: '#/components/schemas/ApiResponse'
 *        "400":
 *          $ref: '#/components/responses/BadRequest'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *
 */

/**
 * @swagger
 * path:
 *  /address/{id}:
 *    patch:
 *      summary: Update  address
 *      description:  Update address .
 *      tags: [Address]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: address id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/createAddress'
 *              required:
 *                - fullname
 *                - phone
 *                - province
 *                - city
 *                - area
 *                - address
 *                - addressType
 *              properties:
 *                fullname:
 *                  type: string
 *                phone:
 *                  type: string
 *                  format: phone no
 *                  description: must be phone no
 *                city:
 *                  type: string
 *                  description: must be a city
 *                addressType:
 *                   type: string
 *                   enum: [home, office]
 *                province:
 *                  type: string
 *                address:
 *                  type: string
 *              example:
 *                fullname: fake product name
 *                phone: "+923018324487"
 *                province: fake province
 *                city: fake city
 *                area: fake city
 *                addressType: home
 *                address: fake address
 *
 *
 *
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Address'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *    delete:
 *      summary: Delete Address
 *      description: Logged in users can delete Address .
 *      tags: [Address]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Address id
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
