const { responseMethod } = require('@/utils/generalDB.methods.js/DB.methods');
const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('@/config/config');
const ApiError = require('@/utils/ApiError');
const en=require('../config/locales/en')
const bucket = new AWS.S3({
  accessKeyId: config.aws.awsAccessKeyId,
  secretAccessKey: config.aws.awsSecretAccesskey,
  region: config.aws.awsRegion,
});

/**
 * S3 utils for uploading, deletion  etc of files
  * @returns {Object<ResponseMethod>} --{status,data,message,isSuccess}
 */
class S3Util {
  constructor(fileName, filePath, buffer) {
    this.fileName = fileName;
    this.filePath = filePath;
    this.buffer = buffer;
    this.params = {
      ACL: "public-read",
      Bucket: config.aws.awsBucketName,
      Key: fileName,// Date.now().toString() + ".log",
    }
  }

  // Upload file to S3

  uploadToS3() {
    try {

      // File reading 
      if (this.filePath) {
        let file = fs.readFileSync(this.filePath, "utf8");
        this.params["Body"] = file;
      }
      else if (this.buffer) {
        this.params["Body"] = this.buffer;
      }


      //Uploading file to S3

      const uploaded = new Promise((resolve, reject) => {
        bucket.upload(this.params, async (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            // remove file from local directory after upload
            if (this.filePath) {
              fs.truncateSync(this.filePath);
            }

            resolve(data.Location);
          }
        });
      });

      return uploaded.then(data => {
        return responseMethod(200, true,'UPDATED', data);
      }).catch(err => {
        return responseMethod(400, false, err, null);
      })
    } catch (err) {
      return responseMethod(400, false, err, null);
    }
  }

   // Delete file from S3
 
  deleteFromS3() {

    // Valid media name
    if (this.params.Key) {

      // AWS deletion Object
      // this.params["Delete"] = { Objects: this.params.Key };

      // Remove extra keys
      // delete this.params.Key;
      delete this.params.ACL

      // Remove file from S3 Promise
      return new Promise((resolve, reject) => {
        bucket.deleteObject(this.params, function (err, data) {

          // S3 Error handling
          if (err) reject(err);
          else
            console.log(
              "Successfully deleted file from bucket");
          resolve(data);
        });
      }).then(result => {
        return result;
      }).catch(err => {
        throw new ApiError(400, err.message);
      })
    } else throw new ApiError(400, 'S3_MODULE.FILE_NAME_IS_REQUIRED');
  }
  deleteManyFromS3() {
    if (this.params.Key) {

      // AWS deletion Object
      this.params["Delete"] = { Objects: this.params.Key };

      // Remove extra keys
      delete this.params.Key;
      delete this.params.ACL

      // Remove file from S3 Promise
      return new Promise((resolve, reject) => {
        s3.deleteObjects(this.params, function (err, data) {

          // S3 Error handling
          if (err) reject(err);
          else
            console.log(
              "Successfully deleted file from bucket");
          resolve(data);
        });
      }).then(result => {
        return result;
      }).catch(err => {
        return responseMethod(400, false, err.message, null);
      })
    } else return responseMethod(400, false, 'S3_MODULE.FILE_NAME_IS_REQUIRED', null);
  }
}


module.exports = S3Util;