const router = require('express').Router();
const tokenValidation = require("./social.token.validation");
const tokenController = require("./social.token.controller");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");

router.route("/")
  .post(auth("socialToken"), validate(tokenValidation.fbRefreshToken), tokenController.fbRefreshToken)
router.route("/business")
  .get(auth("socialToken"), validate(tokenValidation.getFbBussinesId), tokenController.getFbBussinesId)
router.route('/page')
  .get(auth("socialToken"), validate(tokenValidation.getUserPageList), tokenController.getUserPageList)

module.exports = router;
