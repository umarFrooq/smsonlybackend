const express = require("express");
const router = express.Router();
const accessController = require("./access.controller");
const auth = require("../../middlewares/auth");
const accessValidation = require("./access.validation");
const validate = require("../../middlewares/validate");

router
  .route("/")
  .post(
    auth("manageRoles"),
    validate(accessValidation.createAccess),
    accessController.createAccess
  )
  .get(
    auth("getPermissions"),
    accessController.getAllAccesses
  )
router
  .route("/:id")
  .get(
    auth("manageRoles"),
    accessController.getAccessById
  )
  .patch(
    auth("manageRoles"),
    validate(accessValidation.updateAccess),
    accessController.updateAccessById
  )
  .delete(
    auth("manageRoles"),
    accessController.deleteAccess
  );

router
  .route("/module/:module")
  .get(
    auth("manageRoles"),
    accessController.getAccessByModule
  )
  .delete(
    auth("manageRoles"),
    accessController.deleteModule
  );

router
  .route("/module-name")
  .put(
    auth("manageRoles"),
    validate(accessValidation.updateModuleName),
    accessController.updateModuleName
  );

module.exports = router;
