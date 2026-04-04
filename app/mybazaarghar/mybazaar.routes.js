const { createData } = require('./mybazaar.controller');

const router = require('express').Router();

router.route("/")
  .post(createData);

module.exports = router;