
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const categoryValidation = require('./category.validations');
const categoryController= require("./category.controller")
const router = express.Router();

router.route("/all-categories").get(validate(categoryValidation.getCategories),categoryController.allCategories)

module.exports = router;