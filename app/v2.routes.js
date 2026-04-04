var express = require("express");

const routerV2 = express.Router();

routerV2.use("/users", require("./user/user.routes.v2"));
routerV2.use("/categories", require("./category/category.routes.v2"));

module.exports = routerV2