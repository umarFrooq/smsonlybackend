
const db = require("../../config/mongoose");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const Payment = db.Payment;
const en=require('../../config/locales/en')


  


   const getPaymentById = async (id) => {
    return Payment.findOne({_id:id});
  };
  const updatePayment = async (paymentId, user,paymentBody) => {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'PAYMENT_MODULE.PAYMENT_NOT_FOUND');
    }
    if (payment.user.id !== user.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
    }
    
    Object.assign(payment, paymentBody);
    await payment.save();
    return payment;
  
  };
   const deletePayment = async (paymentId) => {
  
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'PAYMENT_MODULE.PAYMENT_NOT_FOUND');
    }
   
    await payment.remove();
    return payment;
   
  };
  const queryPayments = async (filter, options) => {
     const payments = await Payment.paginate(filter, options);
     return payments;
   };
  

module.exports = {
  queryPayments,
  updatePayment,
  deletePayment,
  getPaymentById,
};
