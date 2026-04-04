const httpStatus = require("http-status");
const PV = require("./pv.model");
const axios = require("axios");
const orderid = require('order-id')('dummySecret');
const en=require('../../config/locales/en')

let generatePVId = async(cartId, amount,status) => {

    if(!cartId) return { isSuccess: false, status: 400, data: null, message:'PAYMENT_VERIFICATION_MODULE.CART_ID_MISSING' };
    if(amount == "null" || amount == 0 ) return { isSuccess: false, status: 400, data: null, message:'PAYMENT_VERIFICATION_MODULE.AMOUNT_MISSING'};
    // if(!pvId) return { isSuccess: false, status: 200, data: null, message: "payment Verification Id is required" };
    let oldPV = await PV.findOne({ cart: cartId, current: true });
    let pvId = orderid.generate();
    let pv = new PV({
        cart : cartId,
        pvId : pvId,
        amount : amount,
      })
      if(status)
        pv["status"]=status
    let _pv = await pv.save();
    if(!!pv){
        if(!!oldPV){
        oldPV.current = false;
        oldPV.save();
        }
         return { isSuccess: true, status: 200, data: { pvId }, message: 'PAYMENT_VERIFICATION_MODULE.PAYMENT_VERIFICATION_NOT_FOUND'};
    }

}
let updatePv = async (id, body) => {
    let result = await updateOnePv(id, body)
    return result
}

const updateOnePv=async (id,body)=>{
    let result = await PV.findOneAndUpdate({pvId:id}, body)
return result
}
module.exports = {
    generatePVId,
    updatePv
}