const { awsLambdaKey } = require("@/config/config");
const { voucherStatuses } = require("@/config/enums");
const ApiError = require("@/utils/ApiError");
const db = require("../../config/mongoose");
const { translateProducts } = require("../product/product.service");
const { updateShopifyProducts } = require("../shopify/shopify.service");
const Voucher = db.Voucher;

/**
 * Voucher Job
 * @description This cron job runs every day at 12:00 AM
 *              It checks and updates the status of vouchers.
 *              Vouchers that have expired are updated to EXPIRED
 *              Vouchers that are scheduled and have reached their start date are updated to ACTIVE
 * @param {string} key - The AWS Lambda key
 * @returns {Promise<void>}
 */
const voucherJob = async (key) => {

  const voucherExpired = await Voucher.find({ endDate: { $exists: true }, startDate: { $exists: true }, endDate: { $lte: new Date() }, status: "active" }).select("id").read('secondary');
  if (voucherExpired && voucherExpired.length) {
    const vouchers = voucherExpired.map(ids => ids.id)
    const val = await Voucher.updateMany({ _id: { $in: vouchers } }, { $set: { status: voucherStatuses.EXPIRED } }, { multi: true });
    console.log(val);
  }
  const voucherActive = await Voucher.find({ startDate: { $exists: true }, startDate: { $lte: new Date() }, status: voucherStatuses.SCHEDULED }).select("id").read('secondary');
  if (voucherActive && voucherActive.length) {
    const vouchers = voucherActive.map(ids => ids.id)
    const val = await Voucher.updateMany({ _id: { $in: vouchers } }, { $set: { status: voucherStatuses.ACTIVE } }, { multi: true });
  }


}

/**
 * This function will translate the products in given language
 *
 * @param {string} lang - ISO language code
 * @param {number} limit - limit of products to translate
 * @param {Date} createdAt - date of created products
 *
 * @returns {Promise<void>}
 */

const productTranslate = async (lang = 'ar', limit = 5000, createdAt) => {
  if (limit)
    limit = parseInt(limit)
  return await translateProducts(lang, limit, createdAt);
}

/**
 * This function will update the products in shopify
 *
 * @returns {Promise<void>}
 */

const updateShopifyProductsCron = async () => {
  await updateShopifyProducts();
  return;
}
module.exports = {
  voucherJob,
  productTranslate,
  updateShopifyProductsCron
}