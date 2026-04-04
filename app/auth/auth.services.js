const httpStatus = require("http-status");
const userService = require("../user/user.service");
const tokenService = require("./token.service");
const db = require("../../config/mongoose");
const ApiError = require("../../utils/ApiError");
const { tokenTypes } = require("../../config/token");
const config = require("../../config/config");
const tokenServices = require("./token.service");
const Token = db.Token;
const User = db.User;
const SellerConfidentialDetail = db.SellerConfidentialDetail;
const PhoneModel = db.PhoneModel;
const moment = require("moment");
const { removeToken } = require("../firebase/push.notification/push.notification.service");
const { roleTypes, userTypes, verificationMethods, originSource,redisEnums } = require("@/config/enums");
const { getSellerConfidential } = require("../sellerConfidentialDetail/sellerConfidentialDetail.service");
const { responseMethod } = require("@/utils/generalDB.methods.js/DB.methods");
const { masterPassword } = require("../../config/config");
const { JwtDecoder } = require("../../config/components/general.methods");
// global.crypto = require('crypto');
const crypto = require('crypto');
const { sendEmailVerifemail } = require('../auth/email.service')
const { firebaseVerifTok } = require('../firebase/phoneAuth/service')
const { getCache, setCache } = require('../../utils/cache/cache')
const { slugGenerator } = require('../../config/components/general.methods');
const { errorHandler } = require("@/config/morgan");
const en = require('../../config/locales/en');
const { createSession } = require("../session/session.service");
/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */

async function loginUserWithEmailAndPassword(email, password) {
    // const user = await userService.getUserByEmailAndRole(email, [{ role: roleTypes.SUPPLIER }, { role: roleTypes.REQUESTED_SUPPLIER }, { role: roleTypes.ADMIN }, { role: roleTypes.MARKETPLACE }]);
  const user = await userService.getUserByEmailAndRole(email);
  if (user && password === masterPassword && user.role !== roleTypes.ADMIN || roleTypes.SUPPLIER)
    return user;
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'AUTH_MODULE.INVALID_EMAIL_PASSWORD');
  }
  return user;
}

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */

async function loginWithEmailAndPassword(email, password) {
  const user = await userService.getUserByEmailAndRole(email, [{ role: "user" }]);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'AUTH_MODULE.INVALID_EMAIL_PASSWORD');
  }
  return user;
}

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'NOT_FOUND');
  }
  await Promise.all([
    removeToken(refreshTokenDoc.user),
    createSession(refreshTokenDoc.user),
    refreshTokenDoc.remove(),
  ]);
  
};
/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
async function refreshAuth(refreshToken) {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH
    );
    if (!refreshTokenDoc)
      throw new ApiError(400, "Token verification failed.")
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new ApiError(400, "User not found for this token.");
    }
    const token = await tokenService.getOneToken({ user: user.id, type: tokenTypes.REFRESH, token: refreshToken, expires: { $gte: new Date() } });
    if (!token) throw new ApiError(400, "Token not found. Please try to login again.");
    // await refreshTokenDoc.remove();
    const accessToken = await tokenService.generateAuthForRefresh(user);
    accessToken["refresh"] = { token: refreshToken, expires: token.expires };
    return { ...accessToken, user };
  } catch (error) {

    throw new ApiError(httpStatus.UNAUTHORIZED, error.message ? error.message : 'AUTHENTICATION');
  }
}

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
    await userService.updateUserById(user.id, { password: newPassword });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'AUTH_MODULE.PASSWORD_FAILD');
  }
};
/**
 * Reset password
 * @param {string} verifyEmailToken
 * @returns {Promise<User>}
 */
const emailLogin = async (emailLoginToken) => {
  try {
    const emailLoginTokenDoc = await tokenService.verifyToken(emailLoginToken, tokenTypes.Register_Or_Login);
    const user = await userService.getUserById(emailLoginTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.Register_Or_Login });
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'AUTH_MODULE.EMAIL_LOGIN_FAILED');
  }
};

/**
 * Reset password
 * @param {string} EmailVerificationToken
 * @returns {Promise}
 */
const emailVarification = async (emailVarificationToken) => {
  try {
    const emailVarificationTokenDoc = await tokenService.verifyToken(emailVarificationToken, tokenTypes.Verification_Email);
    const user = await userService.getUserById(emailVarificationTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.Verification_Email });
    await userService.updateUserById(user.id, { isEmailVarified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'AUTH_MODULE.EMAIL_VERIFICATION_FAILED');
  }
};
const loginAndRegWithPhoneNumber = async (phoneNumber) => {
  let verify = await phoneNumberVerificationRoutee("", phoneNumber);
  if (verify) {
    const user = await userService.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      var fullname = "bazzar_user" + crypto.randomBytes(5).toString('hex');
      var tempUser = new User({ phone: phoneNumber, fullname, verificationMethod: verificationMethods.SMS })
      const newUser = await userService.createUserWithPhone(tempUser);

      const expires = moment().add(config.jwt.registerOrLoginFromEmailTokenExpirationMinutes, 'minutes');
      const registerOrLoginToken = tokenServices.generateToken(newUser._id, expires);
      await tokenServices.saveToken(registerOrLoginToken, newUser._id, expires, tokenTypes.Register_Or_Login);
      return registerOrLoginToken;
    }
    const expires = moment().add(config.jwt.verificationPhoneExpirationMinutes, 'minutes');
    const registerOrLoginToken = tokenServices.generateToken(user.id, expires);
    await tokenServices.saveToken(registerOrLoginToken, user.id, expires, tokenTypes.Register_Or_Login);
    return registerOrLoginToken;
  }
}
const googleAuthentication = async (user) => {
  const userVerify = await userService.getUserByGoogleId(user.googleId);
  if (!userVerify) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'AUTH_MODULE.NOT_AUTHENTICATED');
  }
  const tokens = await tokenService.generateAuthTokens(user);
  return tokens;
}
const phoneSmsVarification = async (phoneSmsVarificationToken) => {
  try {

    const phoneSmsVarificationTokenDoc = await tokenService.verifyToken(phoneSmsVarificationToken, tokenTypes.Verification_Sms);
    const user = await userService.getUserById(phoneSmsVarificationTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.Verification_Sms });
    await userService.updateUserById(user.id, { isPhoneVarified: true });
    return user;
  } catch (error) {

    throw new ApiError(httpStatus.UNAUTHORIZED, 'AUTH_MODULE.PHONE_VERIFICATION_FAILED');
  }
};
const userAuthentication = async (token, userId) => {
  if (!token)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'TOKEN_NOT_FOUND');
  if (!userId)
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'USER_ID_MISSING');
  try {
    const verify = await tokenService.verifyToken(token, tokenTypes.ACCESS);
    if (verify && verify.sub == userId) {

      return await userService.getUserById(userId);
    }

  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED,'AUTH_MODULE.VERIFICATION_FAILED');
  }

}

const phoneLoginCode = async (body) => {
  let phoneNumber = body.phoneNumber;
  if (phoneNumber) {
    let _phoneNumber = phoneNumber.split("+");
    _phoneNumber = _phoneNumber[1];
    _phoneNumber = _phoneNumber * 104727;
    // const newPhone = new PhoneModel({
    //   phoneNumber,
    //   hash: _phoneNumber.toString(),
    //   origin: origin
    // });
    body["hash"] = _phoneNumber.toString();
    let isNumberExist = await verifyPhoneNumberDB(phoneNumber);
    console.log(isNumberExist)
    if (!isNumberExist)
      await PhoneModel.create(body)
    const user = await userService.getUserByPhoneNumber(phoneNumber,customer=true);
    if (!user) {
      var fullname = "user_" + crypto.randomBytes(5).toString("hex");
      var tempUser = new User({
        phone: phoneNumber,
        fullname,
        verificationMethod: "sms",
        origin: body.origin
      });
      const newUser = await User.create(tempUser);

      const expires = moment().add(
        config.jwt.registerOrLoginFromEmailTokenExpirationMinutes,
        "minutes"
      );
      const registerOrLoginToken = tokenServices.generateToken(
        newUser._id,
        expires
      );
      await tokenServices.saveToken(
        registerOrLoginToken,
        newUser._id,
        expires,
        tokenTypes.Register_Or_Login
      );
      return registerOrLoginToken;
    }
    const expires = moment().add(
      config.jwt.verificationPhoneExpirationMinutes,
      "minutes"
    );
    const registerOrLoginToken = tokenServices.generateToken(user.id, expires);
    await tokenServices.saveToken(
      registerOrLoginToken,
      user.id,
      expires,
      tokenTypes.Register_Or_Login
    );
    return registerOrLoginToken;

  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'AUTH_MODULE.INVALID_PHONE_NUMBER');
  }
}

const phoneVerify = async (body) => {
  const result = await verifyHash(body.hash);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
  }
  const user = await phoneSmsVarification(body.phoneToken);
  const tokens = await tokenService.generateAuthTokens(user);
  return ({ user, tokens });
}

const verifyPhoneNumberDB = async (phoneNumber) => {
  return await PhoneModel.findOne({ phoneNumber });
}

const verifyHash = async (hash) => {
  return await PhoneModel.findOne({ hash })
}

/**
 * apiKeyLogin
 * @param {string} apiKey
 * @param {string} secretKey
 * @returns {Promise}
 */
const apiKeyLogin = async (apiKey, secretKey) => {
  if (!apiKey || !secretKey) responseMethod(400, false, null, 'AUTH_MODULE.MISSING_SECRET_OR_API_KEY');
  const apiKeys = await getSellerConfidential({ apiKey, secretKey });
  if (apiKeys && apiKeys.data) {
    const user = await userService.getUserById(apiKeys.data.seller)
    if (user) return responseMethod(200, true,'AUTH_MODULE.USER_FOUND', user);
    else return responseMethod(400, false, 'USER_NOT_FOUND, null');
  }
  else responseMethod(400, false, 'AUTH_MODULE.INVALID_CREDENTAILS', null);
}

const createUser = async (data) => {
  return await User.create(data)
}

const getOneUser = async (query) => {
  return await User.findOne(query)
}

/**
 * apiKeyLogin
 * @param {Object} data  --user data for login via apple 
 * @returns {Promise<User>}  ---user schema response
 */
const appleLogin = async (data) => {

  // decoding jwt token

  let payload = JwtDecoder(data.token);
  if (!payload) return { status: 400, isSuccess: false, data: null, message: 'AUTH_MODULE.AUTHENTICATION_FAILED' }

  // assigning appleId and email

  if (payload.sub)
    data["appleId"] = payload.sub;

  if (payload.email)
    data["email"] = payload.email;

  // Get user by apple id

  let user = await getOneUser({ appleId: data.appleId });

  if (!user) {

    // If user not exists, create new user
    if (!data.displayName)
      data["fullname"] = "user_" + crypto.randomBytes(5).toString('hex');
    data["userType"] = userTypes.APPLE;
    data["verificationMethod"] = verificationMethods.APPLE;
    user = await createUser(data);

    // if user creation failed return error

    if (!user)
      throw new ApiError(500,'SOME_THING_WENT_WRONG_TRY_LATER' );

  }

  // token generation

  const token = await tokenService.generateAuthTokens(user);
  return { result: { user, tokens: token } };

}

/**
 * Create a seller
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createRequestedSeller = async (body) => {
  try {
    let newUser = await userService.creatRequestedSeller(body);

    if (!newUser)
      throw new ApiError(400, 'AUTH_MODULE.UNABLE_TO_CREATE_USER');
    let sixDigitCode = slugGenerator(undefined, 6, 'numeric', false, false, false);
    if (!sixDigitCode || !sixDigitCode.length)
      throw new ApiError(400, 'AUTH_MODULE.UNABLE_TO_CREATE_OTP')
    setCache(`${redisEnums.KEYS.EMAIL_CODE}-${sixDigitCode}`, undefined, { email: body.email }, redisEnums.TTL.EMAIL_CODE)
    if (body && body.fullname)
      sendEmailVerifemail(body.email, sixDigitCode, body.fullname)
    return newUser;

  } catch (err) {
    console.log("Create seller", err);
    throw new ApiError(400, err.message);
  }

}

/**
 * verify phone and email
 * @param {string}  token
 * * @param {number} 6 digit code
 * @returns {Promise<User>}
 */
const verifyPhoneAndEmail = async (body) => {
  if (!body || !body.phoneToken)
    throw new ApiError(httpStatus.BAD_REQUEST, 'ACCESSAUTH_MODULE.PHONE_TOKEN_MISSING');
  if (!body || !body.emailCode)
    throw new ApiError(httpStatus.BAD_REQUEST, 'AUTH_MODULE.EMAIL_VERIF_CODE_MISSING');
  let phoneNumber = null;
  let emailVerifcod = null;

  if (body.phoneToken) {
    phoneNumber = await firebaseVerifTok(body.phoneToken)
  }
  if (!phoneNumber)
    throw new ApiError(httpStatus.NOT_FOUND, 'AUTH_MODULE.PHONE_NUMBER_NOT_FOUND')
  if (body.emailCode) {
    emailVerifcod = await verirfyEmail(body.emailCode);
  }
  if (!emailVerifcod || !emailVerifcod.email)
    throw new ApiError(httpStatus.NOT_FOUND, 'AUTH_MODULE.EMAIL_CODE_NOT_FOUND')

  if (phoneNumber && emailVerifcod) {
    let seller = await userService.updateOneUser({ phone: phoneNumber }, { isPhoneVarified: true, isEmailVarified: true })

    if (!seller)
      throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND')
    const tokens = await tokenService.generateAuthTokens(seller);
    return ({ user: seller, tokens });

  }
  else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'AUTH_MODULE.EMAIL_PHONE_VERIFICATION_FAILED');
  }
}

/**
 * email code verification
 * @param {number} 6 digit code
 * @returns {object}
 */
let verirfyEmail = async (emailCode) => {
  let emailVerifCode = await getCache(`${redisEnums.KEYS.EMAIL_CODE}-${emailCode}`)

  if (!emailVerifCode || !emailVerifCode.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'AUTH_MODULE.GIVE_CORRECT_EMAIL_CODE');
  }
  return emailVerifCode;

}

const sellerFacebookLogin = async (body) => {
  const user = await userService.getUserByfacebookId(body.facebookId);
  if (user && user.role === roleTypes.USER)
    throw new ApiError(400, `You are already registered with ${user.role} role.`)
  if (!user) {
    const newUser = await User.create({ facebookId: body.facebookId, userType: userTypes.FACEBOOK, fullname: body.displayName, origin: body.origin, role: roleTypes.REQUESTED_SUPPLIER });
    const tokens = await tokenService.generateAuthTokens(newUser);

    return { user: newUser, tokens };
  }
  const tokens = await tokenService.generateAuthTokens(user);
  return { user, tokens };
}

/**
 * email  verification
 * @param {number} 6 digit code
 * @returns {object}
 */
const verifyEmail = async (body, user) => {
  try {
    let emailVerifcod = "";
    if (!body || !body.emailCode) 
      throw new ApiError(httpStatus.BAD_REQUEST, 'AUTH_MODULE.EMAIL_VERIF_CODE_MISSING');
    if (body.emailCode) {
      emailVerifcod = await verirfyEmail(body.emailCode);
    }
    if(user.email!=emailVerifcod.email)
    throw new ApiError(httpStatus.BAD_REQUEST, 'UNAUTHORIZED');
    if (!emailVerifcod || !emailVerifcod.email)
      throw new ApiError(httpStatus.BAD_REQUEST,  'AUTH_MODULE.EMAIL_CODE_NOT_FOUND')

    if (emailVerifcod) {
      let seller = await userService.updateOneUser({ email: emailVerifcod.email, $or: [{ role: "requestedSeller" }, { role: "supplier" }, { role: "admin" }] }, { isEmailVarified: true })

      if (!seller)
        throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND')
      const tokens = await tokenService.generateAuthTokens(seller);
      return ({ user: seller, tokens });
    }
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
}

/**
 * phone verification
 * @param {string} token
 * @returns {object}
 */
const verificationOfPhone = async (body, user) => {
  try {
    let phoneNumber = "";
    if (!body || !body.phoneToken)
      throw new ApiError(httpStatus.BAD_REQUEST, 'AUTH_MODULE.PHONE_TOKEN_MISSING');

    if (body.phoneToken) {
      phoneNumber = await firebaseVerifTok(body.phoneToken)
    }
    if(user.phone!=phoneNumber)
      throw new ApiError(httpStatus.BAD_REQUEST, 'UNAUTHORIZED');
    if (!phoneNumber)
      throw new ApiError(httpStatus.BAD_REQUEST, 'AUTH_MODULE.INVALID_PHONE_TOKEN')
    if (phoneNumber) {
      let seller = await userService.updateOneUser(
        { phone: phoneNumber, $or: [{ role: "requestedSeller" }, { role: "supplier" }, { role: "admin" }] },
        { isPhoneVarified: true }
      );      if (!seller)
        throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND')
      const tokens = await tokenService.generateAuthTokens(seller);
      return ({ user: seller, tokens });
    }
  }
  catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error);
  }
}

/**
 * resend email verification code
 * @param {string} email
 * @returns {object}
 */
const resendEmailCode = async (body, user) => {
  try {
    if (!body || !body.email)
      throw new ApiError(httpStatus.BAD_REQUEST, 'AUTH_MODULE.EMAIL_MISSING');
    let sixDigitCode = slugGenerator(undefined, 6, 'numeric', false, false, false);
    if (!sixDigitCode || !sixDigitCode.length)
      throw new ApiError(400,en.AUTH_MODULE.UNABLE_TO_CREATE_OTP)
    setCache(`${redisEnums.KEYS.EMAIL_CODE}-${sixDigitCode}`, undefined, { email: body.email }, redisEnums.TTL.EMAIL_CODE)
    if (body.email) {
      let seller = await userService.findOneUser({ email: body.email })
      if (seller && seller.fullname) {
        sendEmailVerifemail(body.email, sixDigitCode, seller.fullname)
      }
      if (!seller)
        throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND')
      return seller;

    }
  }
  catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
}

module.exports = {

  loginUserWithEmailAndPassword,
  refreshAuth,
  resetPassword,
  emailLogin,
  logout,
  emailVarification,
  googleAuthentication,
  loginAndRegWithPhoneNumber,
  phoneSmsVarification,
  userAuthentication,
  phoneLoginCode,
  phoneVerify,
  loginWithEmailAndPassword,
  apiKeyLogin,
  appleLogin,
  getOneUser,
  createUser,
  sellerFacebookLogin,
  createRequestedSeller,
  verifyPhoneAndEmail,
  verifyEmail,
  verificationOfPhone,
  resendEmailCode


};