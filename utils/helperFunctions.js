const config = require("../config/config")

module.exports = {
  getBucketUrl() {
    return `${config.aws.awsBucketName}.s3.${config.aws.awsRegion}.amazonaws.com`
  }
}