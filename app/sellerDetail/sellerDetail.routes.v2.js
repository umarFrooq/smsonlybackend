const router = require('express').Router();
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const sellerDetailValidation = require("./sellerDetail.validations");
const sellerDetailController = require("./sellerDetail.controller");

router.route("/")
  // .get(validate(sellerDetailValidation.getSellerDetails), sellerDetailController.customerSellerDetail)
  .get(validate(sellerDetailValidation.getSellerDetails), sellerDetailController.searchQuerySellerDetail)
router.route("/admin")
  .get(auth("manageStore"), validate(sellerDetailValidation.getSellerDetails), sellerDetailController.sellerDetailAdmin)
module.exports = router;