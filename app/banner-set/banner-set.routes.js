const express = require('express');
const router = express.Router();
const bannerSet = require("./banner-set.controller");
const validate = require('../../middlewares/validate');
const bannerSetValidation = require("./banner-set.validation");
const auth = require('../../middlewares/auth');

router.route("/")
    .post(auth("manageBannerSet"), validate(bannerSetValidation.createBannerSet), bannerSet.createBannerSet)
    .get(validate(bannerSetValidation.getAllBannerSet), bannerSet.getAllBannerSet)
router.route("/admin")
    .get(auth("manageBannerSet"), bannerSet.getAllBannerSet)
router.route("/getbyslug/:slug")
    .get(validate(bannerSetValidation.getBannerSetBySlug), bannerSet.getBannerSetBySlug)
router.route("/:bannerId")
    .get(validate(bannerSetValidation.getBannerSetById), bannerSet.getBannerSetById)
    .delete(auth("manageBannerSet"), validate(bannerSetValidation.deleteBannerSet), bannerSet.deleteBannerSet)
    .patch(auth("manageBannerSet"), validate(bannerSetValidation.updateBannetSet), bannerSet.updateBannerSet)


router.route("/:bannerSetId/banner-set")
    .get(validate(bannerSetValidation.getBannerAndSetById), bannerSet.getBannerAndSet)
    .patch(auth("manageBannerSet"), validate(bannerSetValidation.updateBannerStatus), bannerSet.updateBannerStatus)

router.route("/:bannerSetId/admin")
    .get(auth("manageBannerSet"), auth("manageBannerSet"), validate(bannerSetValidation.getBannerAndSetById), bannerSet.getBannerAndBannerSetAdmin);
router.route("/all/banner").get( validate(bannerSetValidation.getAllBannerSetAndBanners), bannerSet.getBannerSetAndBanners)
module.exports = router;
/**
 * @swagger
 * tags:
 *   name: BannerSet
 *   description: BannerSet management
 */

/**
 * @swagger
 * /banner-set:
 *   post:
 *     summary: Create a new BannerSet
 *     description: Only admins can create BannerSet.
 *     tags: [BannerSet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerSetCreate'
 *           example:
 *             bannerName: "abc"
 *             location: "test"
 *             active: false
 *             type: "slider"
 *             device: "web"
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
/**
 * @swagger
 * /banner-set:
 *   get:
 *     summary: Get all BannerSet
 *     description: Get all bannerset.
 *     tags: [BannerSet]
 *     parameters:
 *       - in: query
 *         name: bannerName
 *         schema:
 *           type: string
 *         description: The name of the banner.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sorting parameter.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items to return per page.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Name for search filtering.
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         description: Value for search filtering.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 results:
 *                   - active: true
 *                     device: mobile
 *                     bannerName: Mobile Web bbb
 *                     location: Mobile Store
 *                     type: gallery
 *                     slug: mobile-web-bbb-XEv3m7J8
 *                     createdAt: "2023-05-04T09:34:49.699Z"
 *                     updatedAt: "2023-09-07T06:38:02.512Z"
 *                     __v: 0
 *                     id: 64537c39550a1c925bd422ff
 *                   - active: true
 *                     device: web
 *                     bannerName: testing banner stage
 *                     location: Web Main
 *                     type: slider
 *                     slug: testing-banner-stage-xINg7mqj
 *                     createdAt: "2023-09-07T07:24:55.637Z"
 *                     updatedAt: "2023-09-07T07:27:10.682Z"
 *                     __v: 0
 *                     id: 64f97ac7d11b74719a9e060e
 *                   - active: true
 *                     device: mobile
 *                     bannerName: Mob Banner Home
 *                     location: Mobile Main
 *                     type: slider
 *                     slug: mob-banner-home-t03hxr00
 *                     createdAt: "2023-09-14T06:55:03.265Z"
 *                     updatedAt: "2023-09-14T06:55:03.265Z"
 *                     __v: 0
 *                     id: 6502ae47c6491f6cfe6ed9c0
 *                   - active: true
 *                     device: web
 *                     bannerName: Home banner
 *                     location: Web Home
 *                     type: slider
 *                     slug: home-banner-ZoefXJcg
 *                     createdAt: "2023-11-27T10:31:15.442Z"
 *                     updatedAt: "2023-11-27T10:31:15.442Z"
 *                     __v: 0
 *                     id: 65646ff3c04f3ccae2a3840d
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 totalResults: 4
 *               status: 200
 *               message: responseMessages.ok
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /banner-set/admin:
 *   get:
 *     summary: Get all BannerSets for admin
 *     description: Only admins can retrieve all BannerSets.
 *     tags: [BannerSet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /banner-set/{slug}:
 *   get:
 *     summary: Get BannerSet by slug
 *     description: Anyone can get BannerSet by slug.
 *     tags: [BannerSet]
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /banner-set/{bannerId}:
 *   get:
 *     summary: Get BannerSet by ID
 *     description: Anyone can get BannerSet by ID.
 *     tags: [BannerSet]
 *     parameters:
 *       - name: bannerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /banner-set/{bannerId}:
 *   delete:
 *     summary: Delete a BannerSet by ID
 *     description: Only admins can delete BannerSet.
 *     tags: [BannerSet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: bannerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /banner-set/{bannerSetId}/banner-set:
 *   get:
 *     summary: Get BannerSet and Banners by ID
 *     description: Anyone can get BannerSet and Banners by ID.
 *     tags: [BannerSet]
 *     parameters:
 *       - name: bannerSetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /banner-set/{bannerSetId}/admin:
 *   get:
 *     summary: Get BannerSet and Banners for admin by ID
 *     description: Only admins can get BannerSet and Banners by ID.
 *     tags: [BannerSet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: bannerSetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /banner-set/all/banner:
 *   get:
 *     summary: Get all BannerSets and Banners
 *     description: Anyone can get all BannerSets and Banners.
 *     tags: [BannerSet]
 *     responses:
 *       200:
 *         description: Successful response with all BannerSets and Banners
 *       404:
 *         description: Not Found
 */

/**
 * @swagger
 * /banner-set/{bannerId}:
 *   patch:
 *     summary: Update BannerSet by Id
 *     description: Only admins can update BannerSet  by ID.
 *     tags: [BannerSet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: bannerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerSetCreate'
 *           example:
 *             bannerName: "abc"
 *             location: "test"
 *             active: false
 *             type: "slider"
 *            
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
/**  
 * @swagger
 * /banner-set/{bannerSetId}/banner-set: 
 *   patch:
 *     summary: Update BannerSet status by ID
 *     description: Only admins can update BannerSet status by ID.
 *     tags: [BannerSet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: bannerSetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerSetCreate'
 *           example:
 *             
 *             active: false
 *             
 *            
 *     responses:
 *       200:
 *         description: Created successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 active: false
 *                 device: web
 *                 bannerName: abc
 *                 location: test
 *                 type: slider
 *                 slug: abc-jtMYxLn4
 *                 createdAt: "2024-01-29T07:29:33.340Z"
 *                 updatedAt: "2024-01-29T07:29:33.340Z"
 *                 __v: 0
 *                 id: 65b753dde8a15c34f04a1764
 *               status: 200
 *               message: Created successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */