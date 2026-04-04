const multer = require("multer");
const config = require(".././config/config");
var multerS3 = require('multer-s3');
const aws = require("aws-sdk");
const ApiError = require("@/utils/ApiError");
s3 = new aws.S3();
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};
// const Description_MIME_TYPE_MAP = {
//   "image/png": "png",
//   "image/jpeg": "jpeg",
//   "image/jpg": "jpg",
//   //"application/pdf": "pdf",
// };
// const fileUpload = function upload(destinationPath) {
//   return multer({
//     fileFilter: (req, file, cb) => {
//       const isValid = !!MIME_TYPE_MAP[file.mimetype];
//       let error = isValid ? null : new Error("Invalid mime type!");
//       cb(error, isValid);
//     },
//     storage: multerS3({
//       limits: 500000,
//       acl: "public-read",
//       s3,
//       bucket: config.aws.awsBucketName,
//       contentType: multerS3.AUTO_CONTENT_TYPE,
//       metadata: function (req, file, cb) {
//         cb(null, { fieldName: file.fieldname });
//       },
//       key: function (req, file, cb) {
//         cb(null, destinationPath + "/" + file.originalname);
//       },
//     }),
//   });
// };
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const isValid = MIME_TYPE_MAP[file.mimetype];
//     let error = new Error("Invalid mime type");
//     if (isValid) {
//       error = null;
//     }
//     cb(error, "temp/");
//   },
//   filename: (req, file, cb) => {
//     const name = file.originalname.toLowerCase().split(" ").join("-");
//     const ext = MIME_TYPE_MAP[file.mimetype];
//     cb(null, name + "-"+file.fieldname + Date.now() + "." + ext);
//   },
// });
const storage = multerS3({
  limits: 500000,
  acl: "public-read",
  s3,
  bucket: config.aws.awsBucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new ApiError(400, "Please upload a .jpg, .jpeg or .png file.");
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


var uploadImages = multer({
  storage: storage,
  limits: { fieldSize: 8 * 1024 * 1024 },
}).fields([
  { name: "gallery", maxCount: 6 },
  { name: "mainImage", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "descriptionImage", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
  { name: "images", maxCount: 6 },
  { name: "cnicFront", maxCount: 1 },
  { name: "cnicBack", maxCount: 1 },
  { name: "reviewImages", maxCount: 5 },
  { name: "refundImage", maxCount: 6 },
  { name: "collectionImage", maxCount: 1 },
  { name: "bannerPhone", maxCount: 1 },
  { name: "notificationImage", maxCount: 1 },
  { name: "wideBannerImage", maxCount: 1 },
  { name: "sellerDetailLogo", maxCount: 1 },
  { name: "langImage", maxCount: 1 },
  { name: "transactionImages", maxCount: 5 },
  { name: "testSheet", maxCount: 5 },
  { name: "certificateImage", maxCount: 1 }
]);
// var discriptionUploads = multer({
//   storage: storage,
//   limits: { fieldSize: 8 * 1024 * 1024 },
// }).fields([

//   { name: "image", maxCount: 1 },
// ]);


module.exports = {
  uploadImages,
  // fileUpload
};
