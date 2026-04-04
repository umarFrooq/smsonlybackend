const catchAsync = require("../../utils/catchAsync");
const logService = require("./logs.service");
const pick = require("../../utils/pick");

const fileConverter = catchAsync(async (req, res) => {
  let options = pick(req.query, ["to", "from"]);
  let filter = pick(req.query, ["endPoint","reqMethod","resStatus","userId","userName"]);
  let result = await logService.filterLog(filter,options);
    res.status(200).send(result);
  });

  const fileUploader = catchAsync(async (req, res) => {
    let result = await logService.uploadToS3();
      res.status(200).send(result);
    });

  module.exports = {
    fileConverter,
    fileUploader
  }