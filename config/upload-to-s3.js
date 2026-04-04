const aws = require("aws-sdk");
const config = require("./config");
const fs = require("fs");
const path = require("path");
const checkMulterParams = require("./check-multer-params");
const { Buffer } = require('buffer');
const en = require('../config/locales/en')

aws.config.setPromisesDependency();
aws.config.update({
  accessKeyId: config.aws.awsAccessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

const getParams = (folderName, multerParamsObject) => {
  return {
    ACL: "public-read",
    Bucket: config.aws.awsBucketName,
    Body: fs.createReadStream(multerParamsObject.filePath),
    Key: `${folderName}/${multerParamsObject.filename}`,
  };
};

const uploadToS3 = ({ file, folderName }) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('S3_MODULE.FILE_REQUIRED'));
    }
    const s3 = new aws.S3();
    let multerCheckReturnValue = checkMulterParams(file); // value returned after multer params are checked
    const paramsArray = [];
    if (Array.isArray(file)) {
      for (let item of multerCheckReturnValue) {
        const params = getParams(folderName, item);
        s3.upload(params, (err, data) => {
          if (err) {
            reject(err);
          }

          if (data) {
            fs.unlinkSync(path.join(item.filePath));
            paramsArray.push(data.Location);
            if (paramsArray.length === multerCheckReturnValue.length) {
              // Don't resolve until all uploads have been completed.
              resolve(paramsArray);
            }
          }
        });
      }
    } else {
      const params = getParams(folderName, multerCheckReturnValue);

      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        }

        if (data) {
          fs.unlinkSync(path.join(multerCheckReturnValue.filePath));
          resolve(data.Location);
        }
      });
    }
  });

const deleteFromS3 = (file) => {
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('S3_MODULE.FILE_PATH_REQUIRED'));
    }
    const s3 = new aws.S3();
    if (Array.isArray(file)) {
      var objects = [];
      for (var k in file) {
        objects.push({ Key: file[k] });
      }

      var deleteParam = {
        Bucket: config.aws.awsBucketName,
        Delete: { Objects: objects },
      };
      s3.deleteObjects(deleteParam, function (err, data) {
        if (err) reject(err);
        if (data) {
          resolve(data);
        }
      });
    } else {
      var deleteParam = {
        Bucket: config.aws.awsBucketName,
        Key: file,
      };
      s3.deleteObject(deleteParam, function (err, data) {
        if (err) reject(err);
        if (data) {
          resolve(data);
        }
      });
    }
  });
};



// Configure AWS S3

async function uploadBase64PDFToS3(base64String, key) {
  // Decode base64 string to a buffer
  const s3 = new aws.S3({
    accessKeyId: config.aws.awsAccessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region,
  });
  const buffer = Buffer.from(base64String, "base64");

  // Set up S3 upload parameters
  const params = {
    ACL: "public-read",
    Bucket: config.aws.awsBucketName,
    Key: `${key}.pdf`, // Name of the file on S3
    Body: buffer,
    ContentEncoding: "base64", // Required if the data is base64 encoded
    ContentType: "application/pdf", // Content type of the file
  };

  try {
    // Uploading to S3
    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. ${data.Location}`);
    return data.Location;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Example usage
// const base64String = 'JVBERi0xL...'; // Your base64 encoded PDF string
// const bucketName = 'your-s3-bucket-name';
// const key = 'path/to/your/file.pdf';

// uploadBase64PDFToS3(base64String, bucketName, key)
//     .then(url => console.log('File uploaded to:', url))
//     .catch(err => console.error('Upload failed:', err));








module.exports = {
  uploadToS3,
  deleteFromS3,
  uploadBase64PDFToS3
};
