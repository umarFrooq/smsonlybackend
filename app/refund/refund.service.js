const db = require("../../config/mongoose");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const Refund = db.Refund;
const { createNew, responseMethod, findOne, findById, updateById, find, } = require("@/utils/generalDB.methods.js/DB.methods");
const orderService = require("../order/order.service");
const { refundTypes, roleTypes, refundStatuses, refundReasons, replacementReasons, orderStatuses, refundMethod, paymentMethods } = require("@/config/enums");
const { addOnWallet } = require("../user/user.service");
const { createItem } = require("../orderItem/orderItem.service");
const { getProductById } = require("../product/product.redis.service");
const { updatePackageItem } = require("../packageItem/packageItem.service");
const { replacementOrder } = require("../orderDetail/orderDetail.service");
const { refundMoney } = require('../checkout/checkout.service')
const { getTransaction } = require('../transaction/transaction.service')
const en = require('../../config/locales/en')
/**
 * Create a refund request
 * @param {Object} refund ---include refund payload
 * @param {Object} images ---images
 * @param {ObjectId} userId ---id of user
 * @returns {Promise<Refund>}
 */
const createRefund = async (refund, images, userId) => {

  // image validation

  if (!images.refundImage || !images.refundImage.length) return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.NO_IMAGES_PROVIDED');
  const isRefund = await findOne(Refund, { orderId: refund.orderId, "refundProduct.product": refund.refundProduct.product, });

  // refund validation if already requested

  // if (!images) return responseMethod(httpStatus.BAD_REQUEST, false, "No images provided.");
  if (isRefund && isRefund.data && Object.keys(isRefund.data).length !== 0)
    return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_ALREADY_REQUESTED');

  if (refund.orderId) {

    if (refund.refundProduct) {

      const order = await orderService.getOrderById(refund.orderId);
      // console.log(order.orderStatus)
      // console.log(order && (order.orderStatus.name != orderStatuses.CANCELLED && order.orderStatus.name != orderStatuses.NEW && order.orderStatus.name != orderStatuses.CONFIRMED));
      // order status validation for refund if status is cancelled,new or confirmed refund request cannot be made
      if (order && order.orderStatus.name != orderStatuses.CANCELLED && order.orderStatus.name != orderStatuses.NEW && order.orderStatus.name != orderStatuses.CONFIRMED) {

        // user validation
        if (userId !== order.customer.id)
          return responseMethod(httpStatus.FORBIDDEN, false, 'REFUND_MODULE.YOU_ARE_NOT_AUTHORIZED');

        // finding requested product exist in order
        if (order && order.orderItems.length > 0) {
          const productExist = order.orderItems.find(
            (item) => item.product.id === refund.refundProduct.product
          );

          if (productExist) {

            if (refund.refundProduct.quantity <= productExist.quantity) {
              // created refund payload
              const refundAmount =
                productExist.product.price * refund.refundProduct.quantity;
              refund["orderDetailId"] = order.orderDetail;
              refund["refundAmount"] = refundAmount;
              refund["refundTo"] = userId;
              refund["images"] = images && images.refundImage && images.refundImage.map(img => img.location);
              refund["seller"] = order.seller.id;
              refund["refundShippment"] = order.shippmentCharges;
              refund["refundTotalAmount"] = order.shippmentCharges + refundAmount;
              return await createNew(Refund, refund);
            } else
              return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_QUANTITY_GREATER_THAN_ORDER_QUANTITY');
          } else
            responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.PRODUCT_NOT_FOUND_IN_THE_ORDER');
        } else
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.ORDER_NOT_FOUND');
      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_REQUEST_CANNOT_BE_MADE_UNTIL_ORDER_IS_READY');
    } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.ORDER_NOT_YET_DELIVERED');
  } else
    return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.ORDER_DETAIL_ID_AND_ORDER_ID_MISSING');
};


/**
 * Update a refund request
 * @param {Object} refund ---include refund payload
 * @param {ObjectId} refundId ---refundId
 * @param {Object} user ---user object
 * @returns {Promise<Refund>}
 */

const updateRefund = async (refund, refundId, user) => {

  const findRefund = await Refund.findById(refundId).populate("orderId");
  // const findRefund = await findById(Refund, refundId);
  // refund validation
  if (findRefund) {
    console.log(findRefund.seller, user.id);
    // If seller is valid to fullfill the request
    console.log(findRefund.seller)
    if (user && user.id == findRefund.seller.id) {
      const result = await sellerRefund(findRefund, refund);
      if (result && result.isSuccess) {
        return await updateById(Refund, refundId, result.data);
      } else return result;
    }
    //Admin can update the refund
    else if (user && user.role === roleTypes.ADMIN) {
      const result = await adminRefund(findRefund, refund);
      if (result && result.isSuccess) {
        return await updateById(Refund, refundId, result.data);
      } else return result;
    } else
      return responseMethod(
        httpStatus.BAD_REQUEST,
        false,
        'REFUND_MODULE.YOU_ARE_NOT_AUTHORIZED_FOR_THIS_ACTION'
      );
  } else
    return responseMethod(
      httpStatus.BAD_REQUEST,
      'REFUND_MODULE.NO_REFUND_REQUEST'
    );
};

/**
 * seller fullfill the refund request
 * @param {Object} findRefund ---refund Data
 * @param {ObjectId} refundId ---payload for updation
 * @param {Object} user ---user object
 * @returns {Promise<Refund>}
 */

const sellerRefund = async (findRefund, updateBody) => {

  // Fullfillment validation

  if ((findRefund && findRefund.rejectByAdmin) || (findRefund && findRefund.refundByAdmin))
    return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.ADMIN_ALREADY_TOOK_AN_ACTION');

  if (updateBody.amount && findRefund.refundAmount > updateBody.refundAmount)
    return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_AMOUNT_SHOULD_NOT_BE_GREATER_THAN_DISPUTE_AMOUNT');

  switch (findRefund.refundStatus) {

    // Refund status requested

    case refundStatuses.REQUESTED:
      if (updateBody.refundStatus === refundStatuses.REJECTED || updateBody.refundStatus === refundStatuses.APPROVED) {

        if (updateBody.refundStatus === refundStatuses.REJECTED && !updateBody.sellerRefundNote) {
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_NOTE');
        }

        if (updateBody.refundStatus === refundStatuses.REFUNDED) {
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.INVALID_ACTION');
        }

        if (updateBody.refundStatus === refundStatuses.APPROVED) {

          if (updateBody.refundAmount) delete updateBody.refundAmount;
          updateBody["refundStatus"] = refundStatuses.APPROVED;

        } else if (updateBody.refundStatus === refundStatuses.REJECTED) {
          updateBody["refundStatus"] = refundStatuses.REJECTED;
        }
        return responseMethod(httpStatus.OK, true, "", updateBody);
      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REJECT_OR_RETURN_FOR_FURTHER_ACTIONS');

    // Refund status rejected

    case refundStatuses.REJECTED:
      return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_NOT_AUTHORIZED_CONTACT_ADMIN'
      );

    // Refund status approved

    case refundStatuses.APPROVED:
      if (updateBody.refundStatus === refundStatuses.RETURNED) {
        // if (updateBody.refundStatus === refundStatuses.REJECTED || updateBody.refundStatus === refundStatuses.REQUESTED)
        //   return responseMethod(httpStatus.BAD_REQUEST, false, "You are not allowed for this action. Please contact admin for further action. "
        //   );
        // if (!updateBody.refundedAmount)
        //   updateBody["refundedAmount"] = findRefund.refundAmount;
        // if (updateBody.refundedAmount > findRefund.refundAmount)
        //   return responseMethod(httpStatus.BAD_REQUEST, false, "Refund amount should be smaller then dispute amount.");
        // addOnWallet({ userId: findRefund.customer, amount: updateBody.refundedAmount ? updateBody.refundedAmount : findRefund.refundAmount, });
        // updateBody["refundedAmount"] = updateBody.refundedAmount
        //   ? updateBody.refundedAmount
        //   : findRefund.refundAmount;

        // if (updateBody.refundedAmount === findRefund.refundAmount) {
        //   updateBody["refundType"] = refundTypes.FULL;
        // } else if (updateBody.refundedAmount < findRefund.refundAmount) {
        //   updateBody["refundType"] = refundTypes.PARTIAL;
        // } else {
        //   return responseMethod(httpStatus.BAD_REQUEST, false, "Refund amount should'nt be greater than dispute amount.");
        // }
        updateBody["refundStatus"] = updateBody.refundStatus;
        return responseMethod(httpStatus.OK, true, "", updateBody);
        break;
      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.ONLY_RETURN_IS_ENABLED');

    // Refund status returned

    case refundStatuses.RETURNED:
      if (updateBody.refundStatus === refundStatuses.RECEIVED) {
        updateBody["refundStatus"] = updateBody.refundStatus;
        return responseMethod(httpStatus.OK, true, "", updateBody);
      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.ONLY_RECIEVED_IS_ENABLED');

    // Refund status received

    case refundStatuses.RECEIVED:
      if (updateBody.refundStatus == refundStatuses.REPLACEMENT || updateBody.refundStatus == refundStatuses.REFUNDED) {
        // if (updateBody.refundStatus == refundStatuses.RECEIVED) {
        if (updateBody.refundStatus === refundStatuses.APPROVED)
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_HAVE_ALREADY_APPROVED_THIS_REQUEST');

        if (updateBody.refundStatus === refundStatuses.REQUESTED)
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_NOT_ALLOWED_FOR_THIS_ACTION');

        if (updateBody.refundedAmount > findRefund.refundAmount)
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_AMOUNT_SHOULD_BE_SMALLER_THEN_DISPUTE_AMOUNT');

        if (updateBody.refundStatus === refundStatuses.REFUNDED) {

          if (!updateBody.refundedAmount)
            updateBody["refundedAmount"] = findRefund.refundAmount;
          await refund(findRefund, updateBody);
        }
        if (updateBody.refundStatus === refundStatuses.REPLACEMENT) {

          const replace = await replacement(findRefund, updateBody);

          if (!replace.isSuccess)
            return replace;
        }
        updateBody["refundStatus"] = updateBody.refundStatus;
        updateBody["refundByAdmin"] = true;
        return responseMethod(httpStatus.OK, true, "", updateBody);

      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_NOT_ALLOWED_FOR_THIS_ACTION');

    // Refund status Refunded

    case refundStatuses.REFUNDED:
      return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.NO_FURTHER_ACTION_ALLOWED');

    // Refund status replacement

    case refundStatuses.REPLACEMENT:
      return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.NO_FURTHER_ACTION_ALLOWED');

    default:
      return responseMethod(httpStatus.BAD_REQUEST, false, 'SOME_THING_WENT_WRONG_TRY_LATER');
  }
};

/**
 * admin fullfill the refund request
 * @param {Object} findRefund ---refund Data
 * @param {ObjectId} refundId ---payload for updation
 * @param {Object} user ---user object
 * @returns {Promise<Refund>}
 */

const adminRefund = async (findRefund, updateBody) => {

  // Fullfillment validation

  if ((findRefund && findRefund.rejectByAdmin) || (findRefund && findRefund.refundByAdmin))
    return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ALLREADY_TOOK_ACTION'
    );

  if (updateBody.refundedAmount && findRefund.refundAmount > updateBody.refundedAmount)
    return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_AMOUNT_SHOULD_NOT_BE_GREATER_THAN_DISPUTE_AMOUNT');

  switch (findRefund.refundStatus) {

    // Refund status requested

    case refundStatuses.REQUESTED:
      if (updateBody.refundStatus === refundStatuses.RETURNED || updateBody.refundStatus === refundStatuses.REJECTED || updateBody.refundStatus === refundStatuses.APPROVED) {

        if (updateBody.refundStatuses === refundStatuses.REJECTED && !updateBody.adminRefundNote) {
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_NOTE');
        }

        if (updateBody.refundStatus === refundStatuses.REFUNDED) {
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.INVALID_ACTION');
        }

        if (updateBody.refundStatus === refundStatuses.APPROVED) {

          if (updateBody.refundAmount) delete updateBody.refundAmount;
          updateBody["approvedByAdmin"] = true;
          updateBody["refundStatus"] = refundStatuses.APPROVED;

        } else if (updateBody.refundStatus === refundStatuses.REJECTED) {
          updateBody["rejectByAdmin"] = true;
          updateBody["refundStatus"] = refundStatuses.REJECTED;
        }

        return responseMethod(httpStatus.OK, true, "", updateBody);
      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_NOT_ALLOWED_FOR_THIS_ACTION');

    // Refund status rejected

    case refundStatuses.REJECTED:

      if (findRefund.rejectByAdmin)
        return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_ALREADY_REJECTED_THIS_REQUEST');

      else {
        updateBody["approvedByAdmin"] = true;
        updateBody["refundStatus"] = updateBody.refundStatus;
        return responseMethod(httpStatus.OK, true, 'REFUND_MODULE.RETURN_REQUEST_SUCCESSFILY_APPROVED', updateBody);
      }

    // Refund status approved

    case refundStatuses.APPROVED:

      if (updateBody.refundStatus == refundStatuses.RETURNED) {
        updateBody["refundStatus"] = refundStatuses.RETURNED;
        return responseMethod(httpStatus.OK, true, 'REFUND_MODULE.RETURN_REQUEST_SUCCESSFILY_APPROVED', updateBody);
      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_NOT_ALLOWED_FOR_THIS_ACTION');
    // if (updateBody.refundStatus === refundStatuses.APPROVED)
    //   return responseMethod(httpStatus.BAD_REQUEST, false, "You have already approved this request.");
    // if (updateBody.refundStatus === refundStatuses.REQUESTED)
    //   return responseMethod(httpStatus.BAD_REQUEST, false, "You are not allowed for this action.");
    // if (updateBody.refundedAmount > findRefund.refundAmount)
    //   return responseMethod(httpStatus.BAD_REQUEST, false, "Refund amount should be smaller then dispute amount.");
    // if (updateBody.refundStatus === refundStatuses.REFUNDED) {
    //   if (!updateBody.refundedAmount)
    //     updateBody["refundedAmount"] = findRefund.refundAmount;
    //   await refund(findRefund, updateBody);
    // }
    // if (updateBody.refundStatus === refundStatuses.REPLACEMENT) {
    //   const replace = await replacement(findRefund, updateBody);
    //   if (!replace.isSuccess)
    //     return replace;
    // }

    // Refund status returned

    case refundStatuses.RETURNED:

      if (updateBody.refundStatus == refundStatuses.RECEIVED) {
        updateBody["refundStatus"] = refundStatuses.RECEIVED;
        return responseMethod(httpStatus.OK, true, 'REFUND_MODULE.RETURN_REQUEST_SUCCESSFILY_APPROVED', updateBody);
      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_NOT_ALLOWED_FOR_THIS_ACTION');

    // Refund status received

    case refundStatuses.RECEIVED:

      if (updateBody.refundStatus == refundStatuses.REPLACEMENT || updateBody.refundStatus == refundStatuses.REFUNDED) {
        // if (updateBody.refundStatus == refundStatuses.RECEIVED) {
        if (updateBody.refundStatus === refundStatuses.APPROVED)
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_HAVE_ALREADY_APPROVED_THIS_REQUEST');

        if (updateBody.refundStatus === refundStatuses.REQUESTED)
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_NOT_ALLOWED_FOR_THIS_ACTION');

        if (updateBody.refundedAmount > findRefund.refundAmount)
          return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.REFUND_AMOUNT_SHOULD_BE_SMALLER_THEN_DISPUTE_AMOUNT');

        if (updateBody.refundStatus === refundStatuses.REFUNDED) {

          if (!updateBody.refundedAmount)
            updateBody["refundedAmount"] = findRefund.refundAmount;
          await refund(findRefund, updateBody);
        }
        if (updateBody.refundStatus === refundStatuses.REPLACEMENT) {

          const replace = await replacement(findRefund, updateBody);
          if (!replace.isSuccess)
            return replace;
        }

        updateBody["refundStatus"] = updateBody.refundStatus;
        updateBody["refundByAdmin"] = true;
        return responseMethod(httpStatus.OK, true, "", updateBody);

      } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.YOU_ARE_NOT_ALLOWED_FOR_THIS_ACTION');

    // Refund status refunded

    case refundStatuses.REFUNDED:
      return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.NO_FURTHER_ACTION_ALLOWED');

    // Refund status refunded
    case refundStatuses.REPLACEMENT:
      return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.NO_FURTHER_ACTION_ALLOWED');

    default:
      return responseMethod(httpStatus.BAD_REQUEST, false, 'SOME_THING_WENT_WRONG_TRY_LATER');
  }
};

const findByRefundId = async (refundId) => {
  return await findById(Refund, refundId);
};

/**
 * Get Refunds
 * @param {Object} filter ---refund filter --- included different properties
 * @param {ObjectId} options ---including sort, page, limit
 * @param {Object} user ---user object
 * @returns {Promise<Refund>}
 */

const getRefunds = async (user, filter, options) => {

  // Product filter

  if (filter && filter.productId) {
    Object.assign(filter, { "refundProduct.productId": filter.productId });
    delete filter.productId;
  }

  // Date filter
  // to and form both provided for date filtration

  if (filter.from && filter.to)
    Object.assign(filter, {
      createdAt: { $gte: new Date(filter.from), $lte: new Date(filter.to) },
    });

  // Only from date filter is provided

  else if (filter.from && !filter.to)
    Object.assign(filter, { createdAt: { $gte: new Date(filter.from) } });

  // Only from date filter is provided

  else if (!filter.from && filter.to)
    Object.assign(filter, { createdAt: { $lte: new Date(filter.to) } });

  delete filter.from;
  delete filter.to;
  let _filter = {};

  // Role type filteration 

  if (user.role === roleTypes.USER)
    _filter = Object.assign(filter, { refundTo: user.id });

  else if (user.role == roleTypes.SUPPLIER)
    _filter = Object.assign(filter, { seller: user.id });

  else if (user.role == roleTypes.ADMIN) _filter = filter;
  let findRefund = await find(Refund, _filter, options);
  return findRefund;
};

/**
 * Get Refund by id
 * @param {ObjectId} refundId ---refund filter --- included different properties
 * @param {Object} user ---user object
 * @returns {Promise<Refund>}
 */

const getRefund = async (refundId, user) => {
  // Refund Id validation

  if (refundId) {
    const refund = await findById(Refund, refundId);

    // role base validation

    if (
      refund &&
      (user.role === roleTypes.ADMIN ||
        user.id == refund.data.refundTo.id ||
        user.id == refund.data.seller.id)
    )
      return refund;

    else
      return responseMethod(
        httpStatus.BAD_REQUEST,
        false,
        'REFUND_MODULE.YOU_ARE_NOT_ALLOWED_TO_VIEW_THIS_REFUND'
      );
  } else
    return responseMethod(
      httpStatus.BAD_REQUEST,
      false,
      'REFUND_MODULE.REFUND_ID_MISSING'
    );
};

// const refundRoleBaseParsing = async (user, refundId, updateBody) => {

//   switch (findRefund.refundStatus) {
//       if (user.role === roleTypes.ADMIN) {

//   }
// }
// }

/**
 * Refund action implementaion
 * @param {Object} findRefund ---refund Data
 * @param {ObjectId} updateBody ---payload for updation
 * @returns {Promise<Refund>}
 */

const refund = async (findRefund, updateBody) => {
  // replacementReasons
  if (updateBody.refundStatus === refundStatuses.REFUNDED) {

    if (findRefund.refundStatus && findRefund.refundStatus === refundStatuses.RECEIVED && !replacementReasons.includes(findRefund.refundReason)) {
      let amount = updateBody.refundedAmount ? updateBody.refundedAmount : findRefund.refundAmount;
      if (findRefund.orderId.paymentMethod == paymentMethods.WALLET_CARD) {
        let remaining = 0
        // findRefund.orderId.paymentTrace.walletPaid<=amount?amount=order.paymentTrace.walletPaid-order.shippmentCharges:body.amount=order.paymentTrace.cardPaid-order.shippmentCharges
        if (findRefund.orderId.paymentTrace.walletPaid <= amount) {
          remaining = amount - findRefund.orderId.paymentTrace.walletPaid
          amount = findRefund.orderId.paymentTrace.walletPaid
        }
        await addOnWallet({ userId: findRefund.orderId.customer.id, amount });
        amount = remaining
        if (amount > 0) {

          let transaction = await getTransaction(findRefund.orderId._id)
          await refundMoney({ amount: amount }, transaction.payId)
        }
      }
      if (findRefund.orderId.paymentMethod == paymentMethods.CARD) {
        let transaction = await getTransaction(findRefund.orderId._id)
        await refundMoney({ amount: amount }, transaction.payId)
      }
      if (findRefund.orderId.paymentMethod == paymentMethods.WALLET || findRefund.orderId.paymentMethod == paymentMethods.COD_WALLET) {
        await addOnWallet({ userId: findRefund.orderId.customer.id, amount });
      }

    } else return responseMethod(httpStatus.BAD_REQUEST, false, "No further action allowed.");
  } else return responseMethod(httpStatus.BAD_REQUEST, false, "You can't refund this request.");


}

/**
 * Replacement action implementaion
 * @param {Object} findRefund ---refund Data
 * @param {ObjectId} updateBody ---payload for updation
 * @returns {Promise<Refund>}
 */

const replacement = async (findRefund, updateBody) => {
  if (updateBody.refundStatus === refundStatuses.REPLACEMENT) {
    if (findRefund.refundStatus && findRefund.refundStatus === refundStatuses.APPROVED && !replacementReasons.includes(findRefund.refundReason)) {
      // const product = getProductById(findRefund.refundProduct.productId);
      // const getOrder = 
      console.log("productId", findRefund.refundProduct.product);
      return await replacementOrder(findRefund, updateBody);
      // const product = findRefund && findRefund.orderId && findRefund.orderId.orderItems.find(ref => ref.product.id == findRefund.refundProduct.product
      // );
      // if (product && product.product) {
      //   console.log(product);
      //   let newItem = { _order: findRefund.orderId, product: product.product, quantity: findRefund.refundProduct.quantity, };

      //   const createOrderItem = await createItem(newItem);
      //   console.log(createOrderItem);
      //   if (createOrderItem && createOrderItem.isSuccess) {
      //     await updatePackageItem(createOrderItem.data.id, { total: updateBody.refundedAmount ? createOrderItem.data.total - updateBody.refundedAmount : createOrderItem.data.total - findRefund.refundAmount, });
      //     const createOrder = orderService.createOrder()
      //     return responseMethod(httpStatus.OK, true, "", createOrderItem);
      //   }
      //   else return responseMethod(httpStatus.BAD_REQUEST, false, "Something went wrong please try later.");
      // } else return responseMethod(httpStatus.BAD_REQUEST, false, "No product found in order.");

    } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.NO_FURTHER_ACTION_ALLOWED');
  } else return responseMethod(httpStatus.BAD_REQUEST, false, 'REFUND_MODULE.CANNOT_REFUND_REQUEST');
}

// const refundInWallet = (refundId) => {

// }
module.exports = {
  createRefund,
  updateRefund,
  getRefunds,
  getRefund,
};
