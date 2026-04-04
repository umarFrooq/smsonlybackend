const db = require("../../config/mongoose");
const Voucher = db.Voucher;
const { createNew, responseMethod, updateById, findById, find, findOne } = require("@/utils/generalDB.methods.js/DB.methods");
const { voucherStatuses, voucherTypes, couponTypes, codeTypes, productTypes } = require("@/config/enums");
const { findOneRedeem, createRedeemSession, getVoucherOrderCount } = require("../redeemVoucher/redeem.voucher.service");
const { addOnWallet } = require("../user/user.service");
const mongoose = require("mongoose");
const ApiError = require("@/utils/ApiError");
const { findOneProduct } = require("../product/product.service");
const { getCartByUser } = require("../cart/cart.service");
const { getDiscount, updateLangData } = require("@/config/components/general.methods");
const en = require('../../config/locales/en')

/**
 * Create Voucher 
 * @param {Object} voucherBody - Voucher body
 * @returns {Promise<VoucherSchema>}
 */

const createVoucher = async (voucherBody) => {
  try {
    if (voucherBody && voucherBody.type === voucherTypes.COUPON && !voucherBody.couponTypeId)
      throw new ApiError(400, 'VOUCHER_MODULE.TYPE_ID_REQUIRED');
    if (voucherBody && voucherBody.type === voucherTypes.COUPON && !voucherBody.couponType)
      throw new ApiError(400, 'VOUCHER_MODULE.COUPON_TYPE_REQUIRED');
    if (voucherBody && voucherBody.type == voucherTypes.COUPON && voucherBody.couponType === couponTypes.PRODUCT && voucherBody.couponTypeId) {
      const product = await findOneProduct({ _id: voucherBody.couponTypeId });
      if (!product || !product.isSuccess || !product.data || !Object.values(product.data).length)
        throw new ApiError(400, 'PRODUCTS_NOT_FOUND');
      if (!product.data.active)
        throw new ApiError(400, 'VOUCHER_MODULE.PRODUCT_INACTIVE');
      if (product.data.quantity < 1)
        throw new ApiError(400, 'VOUCHER_MODULE.PRODUCT_QUANTITY_IS_ZERO');
      if (!product.data.user)
        throw new ApiError(400, 'VOUCHER_MODULE.PRODUCT_OWNER_REMOVED');
      if (!product.data.user.sellerDetail)
        throw new ApiError(400, 'VOUCHER_MODULE.PRODUCT_STORE_REMOVED');
      if (product && product.isSuccess && product.data && product.data.productType != productTypes.MAIN)
        throw new ApiError(400, 'VOUCHER_MODULE.PRODUCT_NOT_A_MAIN_PRODUCT');
      if (voucherBody.quantity && voucherBody.quantity > product.data.quantity)
        throw new ApiError(400, 'VOUCHER_MODULE.Voucher_quantity_should_be_less_or_equal_than_product_quantity')
    }
    if (voucherBody.voucher) {
      const getVoucher = await getByVoucher({ voucher: voucherBody.voucher });
      if (getVoucher && getVoucher.data && getVoucher.isSuccess)
        throw new ApiError(400, 'VOUCHER_MODULE.VOUCHER_ALREADY_EXISTS');
      if (voucherBody.type && getVoucher.data && getVoucher.data.couponTypeId &&
        voucherBody.couponTypeId == getVoucher.data.couponTypeId &&
        getVoucher.data.status == (voucherStatuses.ACTIVE || getVoucher.data.status == voucherStatuses.SCHEDULED))
        throw new ApiError(400, 'VOUCHER_MODULE.COUPON_ALREADY_EXISTS')
    }
    if (voucherBody) {
      const voucher = await createNew(Voucher, voucherBody);
      if (voucher && !voucher.isSuccess)
        throw new ApiError(400, voucher.message);
      return voucher;
    }

    else throw new ApiError(400, 'VOUCHER_MODULE.VOUCHER_BODY_IS_EMPTY');
  }
  catch (err) {
    throw new ApiError(400, err);
  }
};


/**
 * Update Voucher 
 * @param {ObjectId} voucherId - mongosoe ObjectId of voucher
 * @param {Object} voucherBody - Voucher body
 * @returns {Promise<VoucherSchema>}
 */

const updateVoucher = async (voucherId, voucherBody, session) => {
  if (voucherId && voucherBody) {
    const getVoucher = await getVoucherById(voucherId);
    if (!getVoucher || !getVoucher.isSuccess || !Object.keys(getVoucher.data).length)
      throw new ApiError(400, 'VOUCHER_MODULE.VOUCHER_NOT_FOUND_FOR_THIS_ID');
    if (voucherBody.voucher) {
      const getVoucher = await getByVoucher({ voucher: voucherBody.voucher });
      if (getVoucher && getVoucher.data && getVoucher.isSuccess)
        throw new ApiError(400, 'VOUCHER_MODULE.VOUCHER_ALREADY_EXISTS')
    }
    if (voucherBody.lang) {
      voucherBody.lang = updateLangData(voucherBody.lang, getVoucher.lang);
    }
    const voucher = await updateById(Voucher, voucherId, voucherBody, session);
    if (!voucher || !voucher.isSuccess)
      throw new ApiError(400, voucher.message);
    return voucher;
  }

  else throw new ApiError(400, 'VOUCHER_MODULE.VOUCHER_BODY_IS_EMPTY');
}

/**
 * GEt Voucher By Id
 * @param {ObjectId} voucherId - mongosoe ObjectId of voucher
 * @returns {Promise<VoucherSchema>}
 */

const getVoucherById = async (voucherId) => {
  if (voucherId) {
    const voucher = await findById(Voucher, voucherId);
    if (!voucher || !voucher.isSuccess)
      throw new ApiError(400, voucher.message);
    return voucher;
  }

  else throw new ApiError(400, 'VOUCHER_MODULE.VOUCHER_ID_IS_EMPTY');
}

/**
 * GEt Vouchers 
 * @param {Object} filter - required filters
 * @param {Object} options - options for pagination and sorting
 * @returns {Promise<VoucherSchema>}
 */

const getVouchers = async (filter, options) => {
  return await find(Voucher, filter, options);
}

/**
 * GEt by  Voucher 
 * @param {Object} filter - required filters
 * @returns {Promise<VoucherSchema>}
 */

const getByVoucher = async (filter) => {
  // if (filter)
  return await findOne(Voucher, filter);
}


/**
 * Redeem  Voucher 
 * @param {String} voucher - voucher code
 * @param {Object} user - User want to redeem voucher
 * @returns {Promise<VoucherSchema>}
 */

const redeemVoucher = async (voucher, user) => {

  //get Voucher  if its applicable for user 
  const getVoucher = await getByVoucher(
    {
      $or: [{ startDate: { $lte: new Date() } }, { endDate: { $gte: new Date() } }],
      status: voucherStatuses.ACTIVE,
      voucher: voucher,
      numOfVouchers: { $gt: 0 },
      type: voucherTypes.VOUCHER
    });

  // If user already redeemed this voucher

  if (getVoucher && Object.keys(getVoucher.data).length && getVoucher.isSuccess) {
    const redeem = await findOneRedeem({ voucherId: getVoucher.data._id, userId: user.id });

    if (redeem && !redeem.data && redeem.isSuccess) {

      // Start rollback transaction

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await createRedeemSession({ voucherId: getVoucher.data.id, amount: getVoucher.data.amount, userId: user.id }, session);
        await Voucher.updateOne({ _id: getVoucher.data.id }, { $inc: { numOfVouchers: -1 } }, { session })
        await addOnWallet({ userId: user.id, amount: getVoucher.data.amount, description: "Redeem Voucher: " + getVoucher.data.voucher }, session);
        await session.commitTransaction();

        // Successfull transaction to commit

        session.endSession();
        return responseMethod(200, true, 'VOUCHER_MODULE.VOUCHER_SUCCESSFULLY_CREATED', null)

      } catch (err) {
        // rollback transaction if error
        await session.abortTransaction();
        session.endSession();
        return responseMethod(400, false, null, 'VOUCHER_MODULE.VOUCHER_REDEEM_FAILED');
      }
    }

    else if (redeem && Object.keys(getVoucher.data).length && redeem.isSuccess)
      return responseMethod(400, false, 'VOUCHER_MODULE.YOU_HAVE_ALREADY_REDEEEMED_THIS_VOUCHER', null);

    else return responseMethod(400, false, 'VOUCHER_MODULE.SOME_THING_WENT_WRONG', null);

  } else return responseMethod(400, false, 'VOUCHER_MODULE.VOUCHER_IS_NOT_VALID', null);
  // session.endSession();
}

/**
 * Voucher valid for cart
 * @param {String} refCode - voucher code
 * @param {Object} cart - User want to redeem voucher
 * @returns {Promise<VoucherSchema>}
 */

const voucherValidForCart = async (refCode, cart, userId) => {
  try {

    // Voucher validation
    const voucher = await getByVoucher({
      voucher: refCode,
      startDate: { $lte: new Date() }, endDate: { $gte: new Date() }
    });

    // Voucher handling
    let voucher_limit = 0;
    if (!voucher || !voucher.isSuccess || !voucher.data || !Object.keys(voucher.data).length)
      return responseMethod(400, false, 'VOUCHER_MODULE.INVALID_VOUCHER', null);
    if (voucher.data && voucher.data.remainingVoucher && voucher.data.remainingVoucher <= 0)
      return responseMethod(400, false, 'VOUCHER_MODULE.VOUCHER_MAXIMUM_LIMIT_REACHED', null);
    else {

      // Check voucher validity
      if (voucher.data.status != voucherStatuses.ACTIVE)
        return { status: 400, message: 'VOUCHER_MODULE.COUPON_IS_NOT_ACTIVE', data: null, isSuccess: false };
      if (voucher.data.numOfVouchers <= 0)
        return { status: 400, message: 'VOUCHER_MODULE.NO_MORE_COUPON_AVAILABLE', data: null, isSuccess: false };

      if (!cart || !cart.packages) return { status: 400, message: 'VOUCHER_MODULE.THERE_IS_NO_PRODUCT_IN_YOUR_CART_VALID_FOR_THIS_COUPON', data: null, isSuccess: false };
      const voucherData = { voucherProduct: [], voucher: voucher.data };
      for (let i = 0; i < cart.packages.length; i++) {
        const package = cart.packages[i];
        let loop = false

        // Voucher avalibility and validity
        package && package.packageItems && package.packageItems.length && package.packageItems.filter(pi => {


          if (pi.product && pi.product.voucher && pi.product.voucher.voucher == refCode) {
            voucherData.voucherProduct.push(pi.product.id);
            const voucher_data = pi.product.voucher;
            if (voucher_data && voucher_data.limit && voucher.limit <= 0)
              return responseMethod(400, false, null, 'VOUCHER_MODULE.VOUCHER_LIMIT_REACHED');
            loop = true
            voucher_limit += pi.quantity;
            const discount = getDiscount(pi.product.voucher.amount, pi.total, pi.product.voucher.discountType, pi.quantity);
            package.discount += discount;
            package.subTotal = package.subTotal - discount;
            cart.payable = cart.payable - discount;
            cart.subTotal = cart.subTotal - discount;
            cart.discount += discount;
            cart.total = cart.total - discount;
          }
        });

        if (loop)
          break;
      }

      // Exception handling for voucher
      if (!voucherData.voucherProduct || !voucherData.voucherProduct.length)
        return { status: 400, isSuccess: false, message: 'VOUCHER_MODULE.NO_VALID_PRODUCT_RELATED_TO_THIS_VOUCHER_IN_YOUR_CART', data: null };
      if (voucherData && voucherData.voucher && voucherData.voucher.limit) {
        if (voucherData.voucher.limit < voucher_limit)
          return responseMethod(400, false, VOUCHER_MODULE.YOU_CAN_ONLY_BUY + `${voucherData.voucher.limit} ` + en.responseMessages.VOUCHER_MODULE.PRODUCT_WITH_THIS_VOUCHER, null);
        const getUserVoucherDetail = await getVoucherOrderCount(cart.user.id, voucher.data.id);
        if (getUserVoucherDetail) {
          if (voucher_limit + getUserVoucherDetail > voucherData.voucher.limit)
            return responseMethod(400, false, 'VOUCHER_MODULE.YOU_CANNOT_PURCHASE_MORE_PRODUCT_WITH_THIS_VOUCHER', null);
        }
      }


      user = voucherData;
      type = codeTypes.COUPON;
      return { status: 200, message: "ok", data: { type, user, cart }, isSuccess: true };

    }
  } catch (err) {
    return { status: 400, isSuccess: false, message: err, data: null }
  }
}


const deleteVoucher = async (voucherId) => {
  const getVoucher = await getByVoucher({ _id: voucherId });
  if (!getVoucher) throw new ApiError(400, "Voucher not found");
  return {
    status: 200, isSuccess: true, message: "Deleted successfully.", data: await Voucher.findByIdAndDelete(voucherId)
  };
}

const getUserVouchers = async (filter, options) => {
  Object.assign(filter, { status: voucherStatuses.ACTIVE, remainingVoucher: { $gte: 1 } })
  return await getAllVouchers(filter, options);
}

const getAllVouchers = async (filter) => {
  return await Voucher.paginate(filter, options);
}
module.exports = {
  createVoucher,
  updateVoucher,
  getVoucherById,
  getVouchers,
  getByVoucher,
  redeemVoucher,
  voucherValidForCart,
  deleteVoucher,
  getUserVouchers
}