const { voucherStatuses } = require("@/config/enums");
const db = require("../../config/mongoose");
const RedeemVoucher = db.RedeemVoucher;
const { createNew, responseMethod, findOne, findOneAndPopulate } = require("../../utils/generalDB.methods.js/DB.methods");
const mongoose = require('mongoose');
const en=require('../../config/locales/en')
/**
 * Create Redeem
 * @param {Object} redeemBody - required body atleast
 * @returns {Promise<RedeemSchema>}
 */
const createRedeem = async (redeemBody, session) => {
  if (redeemBody)
    return await createNew(RedeemVoucher, redeemBody, session);

  else return responseMethod(400, false, null, 'REDEEM_VOUCHER_MODULE.REDEEM_BODY_IS_EMPTY');
}

/**
 * find One Redeem
 * @param {Object} filter - filter object
 * @returns {Promise<RedeemSchema>}
 */

const findOneRedeem = async (filter) => {
  return await findOne(RedeemVoucher, filter);
}

/**
 * find Redeem voucher records
 * @param {Object} filter - allowed filter values
 * @param {Object} options - inlcuded sortBy, page, limit
 * @param {Object} lookUpQuery - filters of lookups
 * @returns {Promise<RedeemSchema>}
 */

const findRedeemVoucher = async (filter, options, lookUpQuery) => {
  let population = []
  let query = {};

  // Parsing of lookUpQuery

  if (lookUpQuery && Object.keys(lookUpQuery).length) {
    for (key in lookUpQuery) {
      query[`voucher.${key}`] = lookUpQuery[key];
    }
  } else lookUpQuery = null;
  if (filter && !Object.keys(filter).length) filter = null;

  // Selected properties

  const selectedFields = {
    '_id': 1,
    'amount': 1,
    'createdAt': 1,
    'updatedAt': 1,
    'userId': 1,
    'voucher.voucher': 1,
    'voucher.title': 1,
    'voucher.description': 1,
    'voucher._id': 1,
    'voucher.createdAt': 1,
    'voucher.updatedAt': 1,
    'voucher.status': 1,
    'user._id': 1,
    'user.role': 1,
    'user.fullname': 1,

  };

  // Voucher population and query

  population.push({ lookUp: { from: 'vouchers', foreignField: '_id', localField: 'voucherId', as: 'voucher' }, condition: query, options: { empty: true } });

  // User population and query

  population.push({ lookUp: { from: 'users', foreignField: '_id', localField: 'userId', as: 'user' }, options: { empty: true } });
  return await findOneAndPopulate(RedeemVoucher, filter, population, true, options, selectedFields)

}


/**
 * Create redeem for rollback transaction
 * @param {Object} redeemBody - allowed filter values
 * @param {session} session - mongoose session for rollback transaction
 * @returns {Promise<RedeemSchema>}
 */

const createRedeemSession = async (redeemBody, session) => {
  if (redeemBody) {
    const arr = [];
    arr.push(redeemBody)
    const redeem = await RedeemVoucher.create(arr, { session });
    return responseMethod(200, true,'REDEEM_VOUCHER_MODULE.REDEEM_CREATED' , redeem);
  }

  else return responseMethod(400, false, 'REDEEM_VOUCHER_MODULE.REDEEM_BODY_IS_EMPTY' , null);
}

const getVoucherOrderCount = async (userId, voucherId) => {
  const result = await RedeemVoucher.aggregate([
    {
      '$match': {
        'userId': mongoose.Types.ObjectId(userId),
        'voucherId': mongoose.Types.ObjectId(voucherId)
      }
    }, {
      '$group': {
        '_id': null,
        'sum': {
          '$sum': '$quantity'
        }
      }
    }
  ])
  if (result && result.length && result[0].sum)
    return result[0].sum
  else return 0;
}


// const getRedeem = async (filter, options) => {

// }
module.exports = { createRedeem, findRedeemVoucher, findOneRedeem, createRedeemSession, getVoucherOrderCount };