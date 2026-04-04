const httpStatus = require("http-status");
const IPN = require("./alfaIPN.model");
const axios = require("axios");
const alfa = require("@/config/config").alfa;
const PV = require("../paymentVerification/pv.model");
const { Cart } = require("@/config/mongoose");
const paymentMethods = require("@/config/enums").paymentMethods;
const createOrderDetail = require("../orderDetail/orderDetail.service").createOrderDetail;

let callBackIpn = async (user, cartBody, role) => {
    let url = `${alfa.url}/${alfa.merchantId}/${alfa.storeId}/${cartBody.pvId}`;
    return await axios.get(url)
    .then(async res => {
        if(res.data){
            res.data = JSON.parse(res.data);
            if(res.data.ResponseCode && res.data.ResponseCode == "00"){
            ipn = new IPN({...res.data,customer:user.id});
            await ipn.save();
            if(ipn.TransactionStatus == "Paid" ){
                let pv = await PV.findOneAndUpdate({ pvId: cartBody.pvId }, { status: "Paid", ipn : ipn._id },{new: true});
                let paymentTrace = {
                    cardPaid : Number.parseInt(ipn.TransactionAmount)
                }
                await Cart.findByIdAndUpdate({_id:pv.cart}, { paymentMethod : paymentMethods.CARD, paymentTrace:paymentTrace },{new: true});
                delete cartBody.pvId;
                let orderDetailBody = {
                    ...cartBody,
                    cart:pv.cart,
                    paymentId:res.data.TransactionId,
                    OrderDetailId:res.data.TransactionReferenceNumber
                }
                let orders = await createOrderDetail(user,orderDetailBody , role);
                await PV.findOneAndUpdate({ pvId: pv.pvId }, { order: orders._id });
                return orders;
            }
            return ipn;
        }
        else
            return { isSuccess: false, status: 400, data: null, message: res.data.Description};
    }
        console.log(res.data)
    })
    .catch(err => {
        return { isSuccess: false, status: 400, data: null, message: err};
    })
}

let listenerIpn = async (req) => {
    console.log("body",req.body);
    console.log("params",req.params);
    console.log("query",req.query);
    await IPN.create({callbackObject:req.body});
    // return ipn;
    return { isSuccess: true, status: 200, data: { query : req.query, params: req.params, body : req.body}, message: "successfully hit" };
}
let updateIpn = async (id, body) => {
    //TODO reuse the function
    let result = await IPN.findOneAndUpdate({ 'callbackObject.data.id': id }, body)
    return result
}

module.exports = {
    callBackIpn,
    listenerIpn,
    updateIpn
}