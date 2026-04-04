
const config = require("@/config/config");
const httpStatus = require("http-status");
const ApiError = require("@/utils/ApiError");
const axios = require("axios");
const IPN = require('../alfaIPN/alfaIPN.model');
const { gateWay, payment, refund } = require("@/config/enums");
const { axiosUtils } = require("@/config/components/general.methods");
// let { updateIpn } = require('../alfaIPN/alfaIPN.service')
let { updatePv, generatePVId } = require('../paymentVerification/pv.service')
const { updateCart, getCartById } = require('../cart/cart.service')
const { createNewOrderDetail, orderDetailValidations } = require('../orderDetail/orderDetail.service')
const { getOrderById } = require('../order/order.service')
const { getOrderDetailById } = require('../orderDetail/orderDetail.service')
const { getPackageItemId } = require('../orderItem/orderItem.service')
const { updateUserById, getCustomerId } = require('../user/user.service')
const { response } = require("express");
const cartService = require("../cart/cart.service");
const createSession = async (body) => {
    let secretKey = config.checkout.secretKey
    body = Object.assign(body, { processing_channel_id: config.checkout.processingChennelId });


    const options = {
        url: `${config.checkout.checkoutBaseUrl}/payment-sessions`,
        method: "POST",
        headers: {
            'Authorization': `Bearer ${secretKey}`,
        }
    }
    try {
        const response = await axiosUtils(body, options)
        // const response = await axios.post(`${config.checkout.checkoutBaseUrl}/payment-sessions`, body, { headers });
        console.log(response);
        return response
    } catch (error) {
        console.log("checkout error", error)
        throw new ApiError(httpStatus.BAD_REQUEST, error.message)
    }
};

const webHook = (body) => {
    let result = IPN.create({ callbackObject: body, type: gateWay.CHECKOUT })
    return result
}
const getPaymentDetail = async (params, cartId, user) => {
    let approved = null
    let payId = null
    try {
        let userCart = await cartService.getCartByUser(user.id);
        orderDetailValidations(user, userCart, null, null)
        if (userCart.payable.toFixed(2) != params.amount.toFixed(2))
            throw new ApiError(httpStatus.BAD_REQUEST, "Cart amount and payment amount does not match");
        const response = await checkOutTransaction(params, user)
        // const response = { result: { amount:97.34, approved: true, source: { type: "card" } } }
        if (!response.result || !response.result.approved)
            return response

        approved = response.result.approved
        payId = response.result.id
        // let result = await updateIpn(params.payId, { customer: user._id, type: gateWay.CHECKOUT })
        // let pv = await updatePv("9496-179659-9727", { status: "Paid", ipn: result._id }, { new: true });


        let paymentTrace = {
            cardPaid: response.result.amount
        }
        let cart = await updateCart(cartId, { paymentMethod: response.result.source.type.toLowerCase(), paymentTrace: paymentTrace }, { new: true });
        let pv = await generatePVId(cart._id, response.result.amount, payment.STATUS)
        let orderDetailBody = {
            paymentGateway: gateWay.CHECKOUT,
            cardType: response.result.source.type.toLowerCase(),
            ...params,
            cart: cart._id,
            paymentId: response.result.id
        }

        let orders = await createNewOrderDetail(user, orderDetailBody, user.role);
        // await PV.findOneAndUpdate({ pvId: pv.pvId }, { order: orders._id });
        if (pv && pv.data && pv.data.pvId) { let resp = await updatePv(pv.data.pvId, { order: orders._id }) }
        if (response && response.result && response.result.customer && response.result.customer.id) {
            const getUser = await getCustomerId(user.id);
            let payment = getUser.payment ? JSON.parse(JSON.stringify(getUser.payment)) : [];
            const isPayment = payment.find(res => response.result.customer.id == res?.customer)
            if (!isPayment) {
                payment.push({ customer: response.result.customer.id, paymentChanel: gateWay.CHECKOUT });
                updateUserById(user.id, { payment })
            }
        }
        return orders
    } catch (error) {
        if (approved && payId)
            await reversePayment(payId)
        throw new ApiError(httpStatus.BAD_REQUEST, error.message)
    }
};

let refundMoney = async (body, payId) => {
    try {
        if (Object.keys(body).length && body.amount)
            body.amount = Math.round(body.amount * 100)
        const options = {
            url: `${config.checkout.checkoutBaseUrl}/payments/${payId}/refunds`,
            method: "POST",
            headers: {
                'Authorization': `Bearer ${config.checkout.secretKey}`,
            }
        }

        let cardInfo = await axiosUtils(body, options)
        return cardInfo
    } catch (err) {
        throw new ApiError(httpStatus.BAD_REQUEST, err.message)
    }
}

const tokenizeCard = async (body) => {
    try {
        let user
        const options = {
            url: `${config.checkout.checkoutBaseUrl}/tokens`,
            method: "POST",
            headers: {
                'Authorization': `Bearer pk_sbox_e3idjepcwtj53fc5c64ig4lwwmu`,
            }
        }

        let cardInfo = await axiosUtils(body, options)
        return cardInfo
    } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, error)
    }
}
let checkOutTransaction = async (body, user) => {
    try {
        if (Object.keys(body).length && body.amount)
            body.amount = body.amount * 100
        if (user.email)
            body.customer = { email: user.email }
        body = Object.assign(body, { processing_channel_id: config.checkout.processingChennelId })
        const options = {
            url: `${config.checkout.checkoutBaseUrl}/payments`,
            method: "POST",
            headers: {
                'Authorization': `Bearer ${config.checkout.secretKey}`,
            }
        }

        let payment = await axiosUtils(body, options)
        return payment
    } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, error.message)
    }
}
const reversePayment = async (payId) => {
    try {

        const options = {
            url: `${config.checkout.checkoutBaseUrl}/payments/${payId}/reversals`,
            method: "POST",
            headers: {
                'Authorization': `Bearer ${config.checkout.secretKey}`,
            }
        }

        let payment = await axiosUtils({}, options)
        return payment
    } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, error.message)
    }
}
let getCardsDetail = async (user) => {
    try {
        let customer = await getCustomerId(user.id)
        if (!customer || !customer.payment.length || !customer.payment[0].customer)
            return
        const options = {
            url: `${config.checkout.checkoutBaseUrl}/customers/${customer.payment[0].customer}`,
            method: "GET",
            headers: {
                'Authorization': `Bearer ${config.checkout.secretKey}`,
            }
        }

        let userDetail = await axiosUtils({}, options)
        return userDetail
    } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, error.message)
    }
}
module.exports = {
    createSession,
    webHook,
    getPaymentDetail,
    refundMoney,
    tokenizeCard,
    checkOutTransaction,
    getCardsDetail,
};

