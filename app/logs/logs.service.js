const path = require('path');
const fs = require('fs');
const logfile = path.join(__dirname, "./../../middlewares/operations.log");
const _ = require('lodash');
const config = require('@/config/config');
const AWS = require('aws-sdk');
const Log = require("./logs.model");
var cron = require('node-cron');
const ApiError = require("../../utils/ApiError");
const en=require('../../config/locales/en')
const fileConverter = () => {
  let data = fs.readFileSync(logfile, "utf8");
  let arr = [];
  if (data) {
    let _data;
    if (data.includes('\n') && !data.includes('\r\n'))
      _data = data.split("\n");
    else if (data.includes('\r\n'))
      _data = data.split("\r\n");
    for (let i = 0; i < _data.length - 1; i++) {
      let obj = JSON.parse(_data[i]);
      arr.push(obj);
    }
    return arr;
  }
};

const filterLog = (filter, options) => {
  var { from, to } = options;
  if (to) to.setDate(to.getDate() + 1);
  var logs = fileConverter();
  var result = _.filter(logs, filter);

  if (from && to) {
    result = result.filter((obj) => {
      let date = new Date(obj["time"]);
      if (date >= from && date < to) {
        return obj;
      }
    });
  }
  if (from && !to) {
    result = result.filter((obj) => {
      let date = new Date(obj["time"]);
      if (date >= from) {
        return obj;
      }
    });
  }
  if (to && !from) {
    result = result.filter((obj) => {
      let date = new Date(obj["time"]);
      if (date < to) {
        return obj;
      }
    });
  }
  return { result, length: result.length };
};



const uploadToS3 = async (path = logfile, fileName = Date.now().toString() + ".log") => {
  console.log("logs cron job")
  try {
    let fileLocation;
    let file = fs.readFileSync(path, "utf8");
    if (!file) throw new ApiError(401, 'LOG_MODULE.EMPTY_FILE');
    var params = {
      ACL: "public-read",
      Bucket: config.aws.awsBucketName,
      Key: fileName,// Date.now().toString() + ".log",
      Body: file, //binary file data to be provided not file path
    };

    const bucket = new AWS.S3({
      accessKeyId: config.aws.awsAccessKeyId,
      secretAccessKey: config.aws.awsSecretAccesskey,
      region: config.aws.awsRegion,
    });

    const uploadPromise = new Promise((resolve, reject) => {
      bucket.upload(params, async (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          fs.truncateSync(logfile);
          resolve(data.Location);
        }
      });
    });

    fileLocation = await uploadPromise;
    if (fileLocation) {
      const log = new Log({
        logFile: fileLocation
      })
      log.save();
    }
    // fs.createWriteStream(logfile, '')
    console.log(fileLocation);
  }
  catch (err) {
    console.log(err);
  }
};


const createLog = async (data) => {
  const log = new Log(data);
  log.save();
}

// cron.schedule('0 0 1 * *', uploadToS3);


module.exports = {
  fileConverter,
  filterLog,
  uploadToS3,
  createLog
}
// data = fs.readFileSync(logfile, 'utf8');