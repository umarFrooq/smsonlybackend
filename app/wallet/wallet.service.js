const db = require("../../config/mongoose");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { findOne } = require("../../utils/generalDB.methods.js/DB.methods");
const { update } = require("../../models/Shipping");
const bcrypt = require("bcryptjs");
const en=require('../../config/locales/en')
// const { reviewType } = require("./review.enums");
const Wallet = db.Wallet;
const smsService = require("../auth/sms.service");
const tokenService = require("../auth/token.service");

const createWallet = async (user) => {
    let _wallet;
    if (!user) return { status: 400, isSuccess: false, data: {}, message:'USER_NOT_FOUND'};
    _wallet = await Wallet.findOne({ user: user._id });
    if (_wallet) return { status: 400, isSuccess: false, data: {}, message: 'WALLET_MODULE.ALREADY_HAVE_WALLET' };
    let wallet = new Wallet({
        user: user,
        // ...walletBody
    })
    await wallet.save();
    return { status: 201, isSuccess: true, data: wallet, message: 'WALLET_MODULE.WALLET_CREATED' };

};


const createWalletPin = async (user, body) => {
    let { pin, confirmPin } = body;
    if (pin !== confirmPin) return { status: 400, isSuccess: false, data: {}, message:'WALLET_MODULE.INCORRECT_PIN' };
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) return { status: 400, isSuccess: false, data: {}, message: 'WALLET_MODULE.USER_HAVE_NO_WALLET'  };
    if (wallet.enabled) {
        if (wallet.pin) return { status: 400, isSuccess: false, data: {}, message:'WALLET_MODULE.USER_HAVE_ALREADY_SET_THE_WALLET_PIN' };
    }
    wallet["pin"] = pin;
    wallet["enabled"] = true;
    let result = await wallet.save();
    // let result = await Wallet.findByIdAndUpdate(wallet._id, {enabled: true, pin: pin}, { new: true });
    return { status: 200, isSuccess: true, data: result, message: 'WALLET_MODULE.PIN_SET' };
}

const updateWalletPin = async (user, body) => {
    let { enabled, oldPin, newPin, confirmPin } = body;
    let wallet = await Wallet.findOne({ user: user._id });
    let updateBody = {};
    // wallet = _user.wallet;
    if (newPin) {
        if (!wallet.pin) return { status: 400, isSuccess: false, data: {}, message: 'WALLET_MODULE.USER_HAVE_NOT_SET_THE_PIN_YET'  };
        let validPin = await wallet.isPasswordMatch(oldPin);
        if (!validPin) return { status: 400, isSuccess: false, data: {}, message: 'WALLET_MODULE.YOU_HAVE_ENTERED_WRONG_OLD_PIN' };
        if (newPin !== confirmPin) return { status: 400, isSuccess: false, data: {}, message: 'WALLET_MODULE.YOU_HAVE_ENTERED_WRONG_CONFIRM_PIN' };
        wallet["pin"] = newPin;
    }
    if (enabled !== undefined) {
        wallet["enabled"] = enabled;
    }
    // result = await Wallet.findByIdAndUpdate(wallet.id,updateBody,{new:true}) ;
    result = await wallet.save();
    return { status: 200, isSuccess: true, data: result, message: 'WALLET_MODULE.WALLET_UPDATED' };
}

const forgetPinSmsCodeGeneration = async (user, body) => {
    let phone = user.phone || body.phone;
    if (!phone) return { status: 400, isSuccess: false, data: {}, message: 'WALLET_MODULE.PHONE_NUMBER_REQUIRED' };
    let wallet = await Wallet.findOne({ user: user.id });
    if (!wallet || !wallet.pin) return { status: 400, isSuccess: false, data: {}, message: 'WALLET_MODULE.WALLET_PIN_IS_NOT_CREATED_YET' }
    // const result = await smsService.phoneNumberValidation(req.body.phoneNumber);
    // if (!result) {
    //   throw new ApiError(httpStatus.NOT_FOUND, 'phone number not Validated');
    // }
    // const phoneLoginToken = await tokenService.generateVerificationPhoneToken(phone);
    const verificationCode = await smsService.sendVerficationCode("", phone);
    return { status: 200, isSuccess: true, data: { ...verificationCode }, message: `"WALLET_MODULE.DIGIT_CODE_IS_SENT" + ${phone}` };
}


const forgetPinValidator = async (user, body) => {
    let { code, trackingId, pin, confirmPin } = body;
    let verification, error;
    await smsService.codeVerfication(code, trackingId)
        .then((data) => verification = data)
        .catch(err => error = err);
    if (error && error.message) return { status: 400, isSucces: false, data: {}, message: error.message };
    if (!verification || verification.status != "Verified") return { status: 400, isSucces: false, data: {}, message: 'WALLET_MODULE.SOME_THING_WENT_WRONG' };
    let wallet = await Wallet.findOne({ user: user.id });
    if (pin !== confirmPin) return { status: 400, isSucces: false, data: {}, message: 'WALLET_MODULE.WRONG_CONFIRM_PASSWORD' };
    wallet.pin = pin;
    await wallet.save();
    return { status: 200, isSucces: true, data: wallet, message: 'WALLET_MODULE.PIN_UPDATED' };
}

module.exports = {
    createWallet,
    createWalletPin,
    updateWalletPin,
    forgetPinSmsCodeGeneration,
    forgetPinValidator
}