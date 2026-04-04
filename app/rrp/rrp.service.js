const { roleTypes } = require("@/config/enums");
const { createNew, findById, updateById, find } = require("@/utils/generalDB.methods.js/DB.methods");
const db = require("../../config/mongoose");
const { addOnWallet } = require("../user/user.service");
const en=require('../../config/locales/en')
const RRP = db.RRP;

/**
 * 
 * @param {object} data 
 * @returns {Promise<ReponseObject>}  ---RPP Model
 */
const create = async (data) => {
  return await createNew(RRP, data);
}

/**
 * 
 * @param {number} subTotal 
 * @returns {responseObject}
 */

const rrpCalculation = (subTotal) => {
  if (subTotal) {
    let rrpCredit = 0;
    if (subTotal >= 10000 && subTotal <= 15000) rrpCredit = 150;
    else if (subTotal >= 15001 && subTotal <= 25000) rrpCredit = 200;
    else if (subTotal >= 25001 && subTotal <= 45000) rrpCredit = 250;
    else if (subTotal >= 45001) rrpCredit = 300;
    else rrpCredit = 0;
    return { status: 200, message: "", isSuccess: true, data: rrpCredit };
  }
  else return { status: 400, message:'RRP_MODULE.NO_DATA_PROVIDED' , isSuccess: false, data: null };
}

/**
 * 
* @param {object} data 
 * @returns {Promise<ReponseObject>}  --Response Object
 */

const createRRP = async (data) => {
  if (data && data.rrpAmount) {
    const rrpCal = rrpCalculation(data.rrpAmount);
    if (rrpCal && rrpCal.isSuccess) {
      data["rrpCredit"] = rrpCal.data;
      return await create(data);
    }

  } else return { status: 400, message: 'RRP_MODULE.NO_SUBTOTAL', isSuccess: false, data: null };
}
/**
 * 
 * @param {ObjectId} id 
 * @param {object} data 
 * @returns {Promise<ReponseObject>}  --Response Object
 */

const updateRRP = async (id, data) => {
  if (id) {
    return await updateById(RRP, id, data);
  } else return { status: 400, message: 'RRP_MODULE.NO_ID_FOUND', isSuccess: false, data: null };
}

/**
 * 
 * @param {objectId} id 
 * @returns {Promise<ReponseObject>}  --Response Object
 */

const getRRP = async (id) => {
  return await findById(RRP, id);
};
/**
 * 
 * @param {objectId} id 
 * @returns {Promise<ReponseObject>}  --Response Object
 */
const creditAndUpdate = async (id) => {
  if (id) {
    const _getRRP = await getRRP(id);
    if (_getRRP && _getRRP.isSuccess && _getRRP.data && !_getRRP.data.creditBack) {
      const rrpCal = rrpCalculation(_getRRP.data.rrpAmount);
      if (rrpCal && rrpCal.isSuccess && rrpCal.data && rrpCal.data > 0) {
        let data = {};
        data["creditBack"] = true;
        data["rrpCredit"] = rrpCal.data;
        const update = await updateRRP(id, data);
        if (update && update.isSuccess) return await addOnWallet({ userId: _getRRP.data.customer, amount: rrpCal.data });
      }
    }
  }
}

const getAllRRP = async (user, filter, options) => {
  if (user.role === roleTypes.ADMIN) {
    return await find(RRP, filter, options);
  }
  else return { status: 400, message: 'RRP_MODULE.NOT_AUTHORIZED' , isSuccess: false, data: null };
}
module.exports = { create, rrpCalculation, createRRP, updateRRP, getRRP, creditAndUpdate, getAllRRP };