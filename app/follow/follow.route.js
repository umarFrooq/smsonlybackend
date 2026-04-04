const express = require("express");
const router = express.Router();
const auth = require('../../middlewares/auth');
const followController = require("./follow.controller");
const followValidation = require("./follow.validations");
const validate = require('../../middlewares/validate');
router.route("/")
    .post(auth("follow"),validate(followValidation.createFollow),  followController.createFollow)
    //.get(validate(followValidation.getFollow), followController.getFollowerCount)
    .delete(auth("follow"),validate(followValidation._deleteFollow),  followController.deleteFollow)
    .get(auth("follow"), followController.followingList)
    router
    .route("/getFollowersCount")
    .post(validate(followValidation.getFollow), followController.getFollowerCount)
    router
    .route("/unfollow/:storeId")
    .post(auth("follow"),validate(followValidation.unFollow), followController.unFollow)
    
    router.route("/:followed")
    .get( auth("follow"),validate(followValidation.isUserFollowing), followController.isUserFollowing)
    .post( auth("follow"),validate(followValidation.deleteFollow),  followController.deleteFollow)
module.exports = router;
/**
 * @swagger
 * tags:
 *   name: Follow
 *   description: Operations related to following
 */

/**
 * @swagger
 * /follow:
 *   post:
 *     summary: Create a new follow
 *     tags: [Follow]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followed:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the user/store to be followed
 *                 example: "5fd0b0f530a3c1369e0c0ecf"
 *               web:
 *                 type: boolean
 *                 description: Indicator for web follow
 *                 example: true
 *     responses:
 *       200:
 *         description: Successfully created a new follow
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 followed: "605c41a1adbdf45dbed41767"
 *               status: 200
 *               message: "ok"
 *     "401":
 *         $ref: '#/components/responses/Unauthorized'
 *     "403":
 *         $ref: '#/components/responses/Forbidden'
 */
/**
 * @swagger
 * /follow/getFollowersCount:
 *   post:
 *     summary: Get the follower count
 *     tags: [Follow]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the user/store to get follower count
 *                 example: "5fd0b0f530a3c1369e0c0ecf"
 *               seller:
 *                 type: boolean
 *                 description: Indicator for seller
 *                 example: true
 *     responses:
 *       200:
 *         description: Successfully created a new follow
 *         content:
 *           application/json:
 *             example:
 *               data: 1
 *                 
 *               status: 200
 *               message: "ok"
 *     "401":
 *         $ref: '#/components/responses/Unauthorized'
 *     "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /follow/unfollow/{storeId}:
 *   post:
 *     summary: Unfollow a store
 *     tags: [Follow]
 *     security:
 *        - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: string
 *           format: objectId
 *         required: true
 *         description: ID of the store to unfollow
 *     responses:
 *       200:
 *         description: Successfully checked if following
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 followed:
 *                   wallet:
 *                     balance: 200
 *                   isEmailVarified: false
 *                   isPhoneVarified: true
 *                   userType: "local"
 *                   role: "supplier"
 *                   email: "syedsaadjawed@gmail.com"
 *                   fullname: "Humna Handicrafts"
 *                   phone: "03530123456"
 *                   createdAt: "2021-03-25T07:54:09.135Z"
 *                   updatedAt: "2022-03-25T13:05:55.726Z"
 *                   __v: 0
 *                   sellerDetail:
 *                     images:
 *                       - "https://cdn.bazaarghar.com/1617345561645aaaaa.jpeg"
 *                       - "https://cdn.bazaarghar.com/1617345563901aaaaa.jpeg"
 *                       - "https://cdn.bazaarghar.com/1617345568739aaaaa.jpeg"
 *                       - "https://cdn.bazaarghar.com/1617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/1617807677632hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180846986321617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180847415321617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180847800441617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180848147951617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180848212171617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180848234831617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180848252451617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/1618295225347humna-handicrafts.jpg"
 *                     country: "Pakistan"
 *                     costCode: false
 *                     approved: true
 *                     brandName: "Humna Handicrafts"
 *                     description: "&lt;p>Hamna Handicrafts&lt;/p>"
 *                     market:
 *                       type: "sub"
 *                       name: "Zainab Market "
 *                       description: "Bazaarghar brings you Zainab Market with a wide range of Products that were not available online before "
 *                       mainMarket: "605da14836c5f4023c12d89f"
 *                       createdAt: "2021-03-26T08:57:31.728Z"
 *                       updatedAt: "2023-11-07T07:50:28.408Z"
 *                       __v: 0
 *                       image: "https://bazar-247.s3.us-east-2.amazonaws.com/1616752686295zainabbazaar.jpg"
 *                       lang:
 *                         ar:
 *                           name: "test"
 *                           description: "testing "
 *                       subMarkets: []
 *                       id: "605da1e736c5f4023c12d8a0"
 *                     seller: "605c41a1adbdf45dbed41767"
 *                     createdAt: "2021-04-02T06:38:58.618Z"
 *                     updatedAt: "2023-12-01T07:09:07.181Z"
 *                     __v: 14
 *                     rrp: "HH684517"
 *                     alias: "HumnaHandicrafts"
 *                     costCenterCode: "P5aEsUKs"
 *                     slug: "humna-handicrafts"
 *                     lang:
 *                       ar:
 *                         brandName: "الحرف اليدوية السلطة"
 *                         description: "&lt;p>مشغولات يدوية&lt;/p>"
 *                     id: "6066bc0245c30c40c2df8fec"
 *                 refCode: "3tUAb"
 *                 id: "605c41a1adbdf45dbed41767"
 *               follower:
 *                 wallet:
 *                   balance: 0
 *                 isEmailVarified: false
 *                 isPhoneVarified: false
 *                 userType: "local"
 *                 role: "user"
 *                 fullname: "safi siddiqui"
 *                 email: "safi@vintegasolutions.com"
 *                 createdAt: "2021-06-01T13:51:03.397Z"
 *                 updatedAt: "2023-10-18T07:35:35.304Z"
 *                 __v: 0
 *                 refCode: "2H0Cf"
 *                 defaultAddress:
 *                   addressType: "home"
 *                   localType: "local"
 *                   fullname: "safi siddiqui"
 *                   phone: "03011171415"
 *                   province: "panjab"
 *                   city: "Ajnianwala"
 *                   city_code: "AJN"
 *                   address: "vintega solutions"
 *                   user: "60b63b47de13d03759b7016f"
 *                   createdAt: "2021-06-04T06:03:59.324Z"
 *                   updatedAt: "2021-06-04T06:03:59.324Z"
 *                   __v: 0
 *                   id: "60b9c24f9e93337e122e2a20"
 *                 id: "60b63b47de13d03759b7016f"
 *               __v: 0
 *               id: "65b9d0e92c9f0e3a1c0663b6"
 *             status: 200
 *             message: "ok"
 */

/**
 * @swagger
 * /follow/{followed}:
 *   get:
 *     summary: Check if the user is following
 *     tags: [Follow]
 *     security:
 *        - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followed
 *         schema:
 *           type: string
 *           format: objectId
 *         required: true
 *         description: ID of the user/store to check if following
 *     responses:
 *       200:
 *         description: Successfully checked if following
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 followed:
 *                   wallet:
 *                     balance: 200
 *                   isEmailVarified: false
 *                   isPhoneVarified: true
 *                   userType: "local"
 *                   role: "supplier"
 *                   email: "syedsaadjawed@gmail.com"
 *                   fullname: "Humna Handicrafts"
 *                   phone: "03530123456"
 *                   createdAt: "2021-03-25T07:54:09.135Z"
 *                   updatedAt: "2022-03-25T13:05:55.726Z"
 *                   __v: 0
 *                   sellerDetail:
 *                     images:
 *                       - "https://cdn.bazaarghar.com/1617345561645aaaaa.jpeg"
 *                       - "https://cdn.bazaarghar.com/1617345563901aaaaa.jpeg"
 *                       - "https://cdn.bazaarghar.com/1617345568739aaaaa.jpeg"
 *                       - "https://cdn.bazaarghar.com/1617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/1617807677632hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180846986321617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180847415321617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180847800441617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180848147951617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180848212171617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180848234831617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/16180848252451617807668748hamna-handicrafts.jpg"
 *                       - "https://cdn.bazaarghar.com/1618295225347humna-handicrafts.jpg"
 *                     country: "Pakistan"
 *                     costCode: false
 *                     approved: true
 *                     brandName: "Humna Handicrafts"
 *                     description: "&lt;p>Hamna Handicrafts&lt;/p>"
 *                     market:
 *                       type: "sub"
 *                       name: "Zainab Market "
 *                       description: "Bazaarghar brings you Zainab Market with a wide range of Products that were not available online before "
 *                       mainMarket: "605da14836c5f4023c12d89f"
 *                       createdAt: "2021-03-26T08:57:31.728Z"
 *                       updatedAt: "2023-11-07T07:50:28.408Z"
 *                       __v: 0
 *                       image: "https://bazar-247.s3.us-east-2.amazonaws.com/1616752686295zainabbazaar.jpg"
 *                       lang:
 *                         ar:
 *                           name: "test"
 *                           description: "testing "
 *                       subMarkets: []
 *                       id: "605da1e736c5f4023c12d8a0"
 *                     seller: "605c41a1adbdf45dbed41767"
 *                     createdAt: "2021-04-02T06:38:58.618Z"
 *                     updatedAt: "2023-12-01T07:09:07.181Z"
 *                     __v: 14
 *                     rrp: "HH684517"
 *                     alias: "HumnaHandicrafts"
 *                     costCenterCode: "P5aEsUKs"
 *                     slug: "humna-handicrafts"
 *                     lang:
 *                       ar:
 *                         brandName: "الحرف اليدوية السلطة"
 *                         description: "&lt;p>مشغولات يدوية&lt;/p>"
 *                     id: "6066bc0245c30c40c2df8fec"
 *                 refCode: "3tUAb"
 *                 id: "605c41a1adbdf45dbed41767"
 *               follower:
 *                 wallet:
 *                   balance: 0
 *                 isEmailVarified: false
 *                 isPhoneVarified: false
 *                 userType: "local"
 *                 role: "user"
 *                 fullname: "safi siddiqui"
 *                 email: "safi@vintegasolutions.com"
 *                 createdAt: "2021-06-01T13:51:03.397Z"
 *                 updatedAt: "2023-10-18T07:35:35.304Z"
 *                 __v: 0
 *                 refCode: "2H0Cf"
 *                 defaultAddress:
 *                   addressType: "home"
 *                   localType: "local"
 *                   fullname: "safi siddiqui"
 *                   phone: "03011171415"
 *                   province: "panjab"
 *                   city: "Ajnianwala"
 *                   city_code: "AJN"
 *                   address: "vintega solutions"
 *                   user: "60b63b47de13d03759b7016f"
 *                   createdAt: "2021-06-04T06:03:59.324Z"
 *                   updatedAt: "2021-06-04T06:03:59.324Z"
 *                   __v: 0
 *                   id: "60b9c24f9e93337e122e2a20"
 *                 id: "60b63b47de13d03759b7016f"
 *               __v: 0
 *               id: "65b9d0e92c9f0e3a1c0663b6"
 *             status: 200
 *             message: "ok"
 */

/**
 * @swagger
 * /follow:
 *   delete:
 *     summary: Unfollow a user/store
 *     tags: [Follow]
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followed:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the user/store to unfollow
 *                 example: "5fd0b0f530a3c1369e0c0ecf"
 *               id:
 *                 type: string
 *                 format: objectId
 *                 description: 5fd0b0f530a3c1369e0c0ecf
 *                 example: "5fd0b0f530a3c1369e0c0ecf"
 *     responses:
 *       200:
 *         
 *         content:
 *           application/json:
 *             example:
 *               data: null
 *                 
 *               status: 200
 *               message: "ok"
 *     "401":
 *         $ref: '#/components/responses/Unauthorized'
 *     "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /follow:
 *   get:
 *     summary: Get the list of users/stores being followed
 *     tags: [Follow]
 *     security:
 *        - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully get followed
 *         content:
 *           application/json:
 *             example:
 *               data: [followed: "605c41a1adbdf45dbed41767"]
 *                 
 *               status: 200
 *               message: "ok"
 *     "401":
 *         $ref: '#/components/responses/Unauthorized'
 *     "403":
 *         $ref: '#/components/responses/Forbidden'
 */

