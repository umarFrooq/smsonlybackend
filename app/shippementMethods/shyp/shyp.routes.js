const express = require("express");
const router = express.Router();
const shypController = require("./shyp.controller");


router.route("/cities").get(shypController.getCities);
router.route("/sourceCities").get(shypController.shypSourceCities);

module.exports = router;