const mongoose = require('mongoose');
const util = require('util');
const debug = require('debug')('express-mongoose-es6-rest-api:index');
const logger = require('./logger')
const config = require('./config');


const mongoUri = config.mongo.url;
const mongoOptions = config.mongo.options;
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoUri, mongoOptions)

    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}
// // connect to mongo db
// const mongoUri = config.mongo.url;
// const mongoOptions = config.mongo.options;
// mongoose.connect(mongoUri, mongoOptions);
// mongoose.connection.on('error', (error) => {
//   throw new Error(`unable to connect to database: ${mongoUri}`);
// });

// // print mongoose logs in dev env
// if (config.MONGOOSE_DEBUG) {
//   mongoose.set('debug', (collectionName, method, query, doc) => {
//     debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
//   });
// }
module.exports = {
  connectDB,
  report: require('../app/report/report.model'),
  User: require("../app/user/user.model"),
  Cart: require("../app/cart/cart.model"),
  Address: require("../app/address/address.model"),
  Category: require("../app/category/category.model"),
  Review: require("../app/review/review.model"),
  Banner: require("../app/banner/banner.model"),

  SellerConfidentialDetail: require("../app/sellerConfidentialDetail/sellerConfidentialDetail.model"),

  Follow: require("../app/follow/follow.model"),

  BannerSetModel: require('../app/banner-set/banner-set.model'),
  NotificationModel: require('../app/notifications/notification.model'),
  FirebaseTokenModel: require('../app/firebase/push.notification/firebase.token.model'),
  Visit: require('../app/stats/stats.model'),
  ReviewStats: require("../app/review.stats/review.stats.model"),
  Refund: require("../app/refund/refund.model"),
  RRP: require("../app/rrp/rrp.model"),
  Wallet: require("../app/wallet/wallet.model"),
  Voucher: require("../app/voucher/voucher.model"),
  RedeemVoucher: require("../app/redeemVoucher/redeem.voucher.model"),
  Transaction: require("../app/transaction/transaction.model"),
  Token:require('../app/auth/token.model'),
  Salary: require('../app/payroll/salary.model'),
  Exam: require('../app/exam/exam.model'),
  DateSheet: require('../app/datesheet/datesheet.model'),
  Result: require('../app/result/result.model'),
  Complaint: require('../app/complaint/complaint.model').Complaint
};

