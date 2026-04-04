const db = require("../../config/mongoose");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const Address = db.Address;
const en=require('../../config/locales/en')
//const productService  = require('../product/product.service');
const {updateLangData}=require('../../config/components/general.methods')
/**
 * create an Address
 * @param {String} userId
 * @param {Object} addressBody
 * @returns {Promise<Address>}
 */

const createAddress = async (userId, addressBody) => {
  addressBody["user"] = userId;

  // const newAddress = new Address({
  //   fullname: addressBody.fullname,
  //   phone: addressBody.phone,
  //   province: addressBody.province,
  //   city: addressBody.city,
  //   city_code: addressBody.city_code,
  //   area: addressBody.area,
  //   address: addressBody.address,
  //   addressType: addressBody.addressType,
  //   user: userId,
  //   localType: addressBody.localType,
  //   country: addressBody.country,
  //   state: addressBody.state,
  //   addressLine_2: addressBody.addressLine_2,
  //   zipCode: addressBody.zipCode

  // });
  //  if(addressBody.localType){
  //    newAddress.newAddress=addressBody.localType
  //  }
  try {
    const address = await Address.create(addressBody);

    // if(address){
    //   await userServices.updateUserById(userId,{defaultAddress:address.id});
    // }
    return address;
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
};
const getAllAddresses = async (userId) => {
  const addresses = await Address.find({ user: userId }).sort("-createdAt");
  return addresses;
};

const getAddressById = async (id) => {
  return Address.findOne({ _id: id });
};
const updateAddress = async (addressId, userId, updateBody) => {
  try {
    const address = await getAddressById(addressId);
    if (!address) {
      throw new ApiError(httpStatus.NOT_FOUND, 'ADRESS_NOT_FOUND');
    }
    if (address.user.toString() !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
    }
    if (updateBody.lang) {
      updateBody.lang = updateLangData(updateBody.lang, address.lang);
    }
    Object.assign(address, updateBody);
    await address.save();
    return address;
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
};
const deleteAddress = async (addressId, userId) => {
  const  {getUserById} = require('../user/user.service'); 
  
    const address = await getAddressById(addressId);
    if (!address) {
      throw new ApiError(httpStatus.NOT_FOUND, 'ADRESS_NOT_FOUND');
    }
    if (address.user.toString() !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
    }
    const user = await getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
    }
    if(user.defaultAddress && user.defaultAddress._id.toString() === address.id){
      throw new ApiError(httpStatus.FORBIDDEN, 'ADDRESS_MODULE.CANNOT_DELETE_DEFAULT_ADDRESS');
    }
    await address.remove();
    return address;
  };

/**
 * Get User Addresses
 * @param {String} phone
 * @returns {Promise<Address>}
 */
const getUserAddresses = async (phone) => {
  // const userService = require("../user/user.service");
  // if (phone) {
  const user = await getUser(phone);
  if (user.data && user.isSuccess) {
    const addresses = await getAllAddresses(user.data.id);
    return {
      status: 200,
      message: 'ADDRESS_MODULE.USER_ADDRESSES',
      data: addresses,
      isSuccess: true,
    };
  } else
    return {
      status: 400,
      message: 'ADDRESS_MODULE.NO_USER_FOUND_WITH_THIS_NUMBER',
      data: null,
      isSuccess: false,
    };

  // else return { status: 400, message: "Phone number is required", data: null, isSuccess: false }
};
/**
 * Get User By phone
 * @param {String} phone
 * @returns {Promise<User>}
 */

const getUser = async (phone) => {
  const userService = require("../user/user.service");
  if (phone) {
    const user = await userService.getUserByPhoneNumber(phone);
    return { status: 200, message: "OK", data: user, isSuccess: true };
  } else
    return {
      status: 400,
      message: 'ADDRESS_MODULE.PHONE_NUMBER_MISSING',
      data: null,
      isSuccess: false,
    };
};

/**
 * Get User By phone
 * @param {String} phone
 * @param {Object} addressBody
 * @returns {Promise<Address>}
 */
const createAsAdmin = async (phone, addressBody) => {
  const user = await getUser(phone);
  if (addressBody) {
    if (user.data && user.isSuccess) {
      const address = await createAddress(user.data.id, addressBody);
      return {
        status: 200,
        message:  'CREATED_SUCCESSFULLY',
        data: address,
        isSuccess: true,
      };
    } else
      return {
        status: 400,
        message:  'ADDRESS_MODULE.NO_USER_FOUND_WITH_THIS_NUMBER',
        data: null,
        isSuccess: false,
      };
  } else
    return {
      status: 400,
      message:  'ADDRESS_MODULE.ADDRESS_BODY_IS_EMPTY',
      data: null,
      isSuccess: false,
    };
};
const updateAsAdmin = async (phone, updateBody) => {
  const user = await getUser(phone);
  if (user.data && user.isSuccess) {
    const addressId = updateBody.addressId;
    delete updateBody.addressId;
    const address = await updateAddress(addressId, user.data.id, updateBody);
    return address;
  } else {
    throw new ApiError(httpStatus.NOT_FOUND,  'USER_NOT_FOUND');
  }
};
module.exports = {
  createAddress,
  getAddressById,
  getAllAddresses,
  updateAddress,
  deleteAddress,
  getUserAddresses,
  createAsAdmin,
  updateAsAdmin,
};
