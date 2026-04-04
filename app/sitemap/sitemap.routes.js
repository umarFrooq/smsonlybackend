const express = require('express');
const siteMapController = require('./sitemap.controller');
const router = express.Router();
const lambdaAuth = require('@/middlewares/lambda.auth');

router.route("/")
  .get(lambdaAuth, siteMapController.generateSiteMap)

module.exports = router;