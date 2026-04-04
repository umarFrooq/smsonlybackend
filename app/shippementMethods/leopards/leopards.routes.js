const express = require("express");
const router = express.Router();
const leoController = require("./leopards.controller");
router.route("/cities").get(leoController.getCities);

module.exports = router;