const multer = require("multer");
const config = require(".././config/config");
var multerS3 = require('multer-s3');
const aws = require("aws-sdk");
s3 = new aws.S3();
const MIME_TYPE_MAP = {
  "video/quicktime": "mov",
  "video/mp4": "mp4",
};

const storage = multerS3({
  limits: 500000,
  acl: "public-read",
  s3,
  bucket: config.aws.awsBucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Please upload a .mov or .mp4 file");
    if (isValid) {
      error = null;
      cb(null, { fieldName: file.fieldname });
    }
    cb(error);


    //  cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    let removeSpecialCharacters = file.originalname.toLowerCase().replace(/[^A-Z0-9.]+/ig, "-");
    //  const name = Date.now()+file.originalname.toLowerCase().split(" ").join("-");
    const name = Date.now() + removeSpecialCharacters;
    //  const name = Date.now()+file.originalname.toLowerCase().split(" ").join("-");
    const ext = MIME_TYPE_MAP[file.mimetype];

    cb(null, name);
    //  cb(null, destinationPath + "/" + file.originalname);
  },
});
const videoUpload = multer({
  storage: storage,
  limits: { fieldSize: 8 * 1024 * 1024 },
}).fields([
  { name: "productVideo", maxCount: 1 },

]);

module.exports = {
  videoUpload
}