
const httpStatus = require('http-status');
const { Package } = require('../../config/mongoose');
const catchAsync = require('../../utils/catchAsync');
const walletService = require('./wallet.service');
const en=require('../../config/locales/en')

const createWallet = catchAsync(async (req, res) => {
    const result = await walletService.createWallet(req.user, req.body);

    // res.status(httpStatus.CREATED).send(result);
    res.sendStatus(result.data,result.status,result.message);
})

const createWalletPin = catchAsync(async (req, res) => {
    const result = await walletService.createWalletPin(req.user, req.body);
    // res.status(httpStatus.CREATED).send(result);
    res.sendStatus(result.data,result.status,result.message);
})  

const updateWalletPin = catchAsync(async (req, res) => {
    const result = await walletService.updateWalletPin(req.user, req.body);
    // res.status(httpStatus.CREATED).send(result);
    res.sendStatus(result.data,result.status,result.message);
})  

const sendForgetPinSmsCode = catchAsync(async (req, res) => {
    // let phone = req.user.phone;
    // if(!phone) throw new ApiError(httpStatus.NOT_FOUND, 'phone number not found');
    // // const result = await smsService.phoneNumberValidation(req.body.phoneNumber);
    // // if (!result) {
    // //   throw new ApiError(httpStatus.NOT_FOUND, 'phone number not Validated');
    // // }
    // const phoneLoginToken = await tokenService.generateVerificationPhoneToken(phone);
    // const verificationCode = await smsService.sendVerficationCode("", phone);
    // res.status(httpStatus.OK).send({ phoneLoginToken, verificationCode });
    const result = await walletService.forgetPinSmsCodeGeneration(req.user, req.body);
    // res.status(httpStatus.OK).send(result);
    res.sendStatus(result.data,result.status,result.message);
  });

  const forgetPinValidator = catchAsync(async (req, res) => {
    const result = await walletService.forgetPinValidator(req.user, req.body);
    // res.status(httpStatus.OK).send(result);
    res.sendStatus(result.data,result.status,result.message);
})



module.exports = {
    createWallet,
    createWalletPin,
    updateWalletPin,
    sendForgetPinSmsCode,
    forgetPinValidator
}