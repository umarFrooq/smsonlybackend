const router = require('express').Router();
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('./user.validations');
const userController = require("./user.controller");
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import the new middleware
router.use(auth('getUsers'), schoolScopeMiddleware); // manageBranches perm for superadmin
router.route("/admin")
  // .get(auth('getUsers'), validate(userValidation.getAllUsers), userController.getAllUsers)
  .get(auth('getUsers'), validate(userValidation.getAllUsers), userController.getAllUser)
  .patch(auth('getUsers'), validate(userValidation.changePasswordAdmin), userController.changePasswordAdmin)

module.exports = router;