const authService = require("./auth.services");
const userService = require("../user/user.service");
const tokenService = require("./token.service");
const emailService = require("./email.service");
const schoolService = require('../school/school.service');
const httpStatus = require('http-status');
const smsService = require("./sms.service");
const catchAsync = require("../../utils/catchAsync");
const ApiError = require('../../utils/ApiError');
const db = require("../../config/mongoose");
const User = db.User;
const { userTypes } = require("../../config/enums");
const { roleRights } = require('../../config/roles'); // Import roleRights
const en = require('../../config/locales/en')
const { logEvent } = require('../analytics/analytics.service');

const login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body; // role from body is unusual for login, typically derived from user found by email/pass
  const user = await authService.loginUserWithEmailAndPassword(email, password); // Pass only email/password to service
  const tokens = await tokenService.generateAuthTokens(user);
  const userPermissions = roleRights.get(user.role) || [];

  // Exclude password from user object sent to frontend
  const userToSend = { ...user.toJSON() }; // Use .toJSON() if available from Mongoose model to strip virtuals/hidden paths
  delete userToSend.password;
  await logEvent({ module: 'auth', action: 'login', userId: user._id, details: { email } });

  res.status(httpStatus.OK).send({
    user: userToSend,
    tokens,
    roles: [user.role], // Send role as an array
    permissions: userPermissions
  });
});
const facebookLogin = catchAsync(async (req, res) => {

  //const { email, password } = req.body;
  const user = await userService.getUserByfacebookId(req.body.facebookId);
  if (!user) {
    const newUser = await User.create({ facebookId: req.body.facebookId, userType: userTypes.FACEBOOK, fullname: req.body.displayName, origin: req.body.origin });
    const tokens = await tokenService.generateAuthTokens(newUser);

    // return res.status(httpStatus.OK).send({ newUser, tokens });
    res.sendStatus({ user: newUser, tokens });
  }
  const tokens = await tokenService.generateAuthTokens(user);

  // return res.status(httpStatus.OK).send({ user, tokens });
  res.sendStatus({ user, tokens });
});
const googleLogin = catchAsync(async (req, res) => {


  const user = await userService.getUserByGoogleId(req.body.googleId);
  if (!user) {
    const data = {
      googleId: req.body.googleId, 
      userType: userTypes.GOOGLE,
      ullname: req.body.displayName,
      origin: req.body.origin
     }
     if(req.body.email){
       data.email = req.body.email
     }
   const newUser = await User.create(data);
    // const newUser = await User.create({ googleId: req.body.googleId, userType: userTypes.GOOGLE, fullname: req.body.displayName, origin: req.body.origin });
    const tokens = await tokenService.generateAuthTokens(newUser);

    // return res.status(httpStatus.OK).send({ newUser, tokens });
    res.sendStatus({ user: newUser, tokens });
  }
  const tokens = await tokenService.generateAuthTokens(user);
  // return res.status(httpStatus.OK).send({ user, tokens });
  res.sendStatus({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
})
const registerUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body,req.user.schoolId);
  const tokens = await tokenService.generateAuthTokens(user);
  // res.status(httpStatus.CREATED).send({ user, tokens });
  res.sendStatus({ user, tokens });
});

const registerRequestedSeller = catchAsync(async (req, res) => {
  const user = await userService.createRequestedSeller(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  // res.status(httpStatus.CREATED).send({ user, tokens });
  res.sendStatus({ user, tokens });
});
const refreshTokens = catchAsync(async (req, res) => {

  const refreshtokens = await authService.refreshAuth(req.body.refreshToken);
  // res.status(httpStatus.OK).send({ ...tokens, user });
  res.sendStatus({ tokens: { access: refreshtokens.access, refresh: refreshtokens.refresh }, user: refreshtokens.user });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email
  );

  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});
const registerOrLoginFromEmail = catchAsync(async (req, res) => {
  const loginEmailToken = await tokenService.generateRegisterOrLoginFromEmailToken(
    req.body.email
  );
  await emailService.sendLoginEmail(req.body.email, loginEmailToken);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});

const publicRegisterSchool = catchAsync(async (req, res) => {
  // Expecting body to contain schoolName and admin details
  const body = req.body || {};
  const schoolName = body.schoolName || body.nameOfSchool || body.schoolNameOf;
  const adminPayload = {
    fullname: body.adminName || body.fullname || `${schoolName} Admin`,
    email: body.adminEmail || body.adminEmailAddress || body.email,
    phone: body.adminPhone || body.phone,
    password: body.adminPassword || body.password,
  };

  if (!schoolName || !adminPayload.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'SCHOOL_MODULE.MISSING_REQUIRED_FIELDS');
  }

  // Create school and admin user
  const result = await schoolService.createSchoolWithAdmin({ nameOfSchool: schoolName }, adminPayload);

  // Generate email verification token and send verification email
  try {
    const verifyToken = await tokenService.generateVerificationEmailToken(adminPayload.email);
    await emailService.sendVerificationEmail(adminPayload.email, verifyToken);
  } catch (err) {
    // If email send or token generation fails, we still return created resources but log the error
    console.error('Failed to send verification email:', err.message || err);
  }

  res.status(httpStatus.CREATED).send({ school: result.school, admin: result.user, message: 'VERIFICATION_SENT' });
});
const emailLogin = catchAsync(async (req, res) => {
  const user = await authService.emailLogin(req.query.token);
  const tokens = await tokenService.generateAuthTokens(user);
  // res.status(httpStatus.CREATED).send({ user, tokens });
  res.sendStatus({ user, tokens });
})
const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerificationEmailToken(
    req.body.email
  );
  await emailService.sendVerificationEmail(req.body.email, verifyEmailToken);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});

const emailVarification = catchAsync(async (req, res) => {
  await authService.emailVarification(req.query.token);
  // res.status(httpStatus.NO_CONTENT).send();
  res.sendStatus();
});
const defaultAddress = catchAsync(async (req, res) => {
  const user = await userService.defaultAddress(req.user.id, req.body);
  res.sendStatus(user)
});
const sendSmsCode = catchAsync(async (req, res) => {
  const result = await smsService.phoneNumberValidation(req.body.phoneNumber);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'AUTH_MODULE.PHONE_NUMBER_NOT_VALIDATE');
  }
  const phoneLoginToken = await tokenService.generateVerificationPhoneToken(req.body.phoneNumber);
  const verificationCode = await smsService.sendVerficationCode("", req.body.phoneNumber);
  // res.status(httpStatus.OK).send({ phoneLoginToken, verificationCode });
  res.sendStatus({ phoneLoginToken, verificationCode });
});

const smsCodeVarificationLogin = catchAsync(async (req, res) => {

  const result = await smsService.codeVerfication(req.body.code, req.body.trackingId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
  }
  const user = await authService.phoneSmsVarification(req.body.phoneLoginToken);
  const tokens = await tokenService.generateAuthTokens(user);
  // res.status(httpStatus.OK).send({ user, tokens });
  res.sendStatus({ user, tokens });
});
const routeeValidation = catchAsync(async (req, res) => {
  const result = await smsService.routeeValidation(req.body.phoneNumber);
  res.status(httpStatus.OK).send(result);
})
const sendVerificationSmsCode = catchAsync(async (req, res) => {
  // await smsService.phoneNumberValidation(
  //     req.body.phoneNumber
  // );
  const verificationCode = await smsService.sendVerficationCode("", req.body.phoneNumber);


  // res.status(httpStatus.OK).send(verificationCode);
  res.sendStatus(verificationCode);
});


const facebookAuthentication = catchAsync(async (req, res) => {
  let verify = await authService.facebookAuthentication();
  // res.status(httpStatus.OK).send(verify);
  res.sendStatus(verify);
});
// const isLoggedIn = catchAsync(async(req, res, next) => {
//     if (req.user)
//         next()
//     else
//         res.status(httpStatus.OK).send("Unauthorized");
// })

const googleAuthentication = catchAsync(async (req, res) => {
  let verify = await authService.googleAuthentication();
  if (verify) {
    tokenService.generateAuthTokens()
  }
  // res.status(httpStatus.OK).send(verify);
  res.sendStatus(verify);
});

const googleAuthenticationAndTokenGeneration = catchAsync(async (req, res) => {
  let user = await userService.getUserByGoogleId(req.user.googleId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
  }
  const tokens = await tokenService.generateAuthTokens(req.user);

  // res.status(httpStatus.OK).send({
  //   tokens,
  //   user
  // });
  res.sendStatus({ tokens, user });
});

const facebookAuthenticationAndTokenGeneration = catchAsync(async (req, res) => {
  let user = await userService.getUserByfacebookId(req.user.facebookId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
  }
  const tokens = await tokenService.generateAuthTokens(req.user);
  // res.status(httpStatus.OK).send({
  //   tokens,
  //   user
  // });
  res.sendStatus({ tokens, user });
});
const current = catchAsync(async (req, res) => {
  const _user = req.user;
  res.status(httpStatus.OK).send({ _user });
  // res.sendStatus(_user);
})

const phoneLoginCode = catchAsync(async (req, res) => {
  await authService.phoneLoginCode(req.body);
  const phoneLoginToken = await tokenService.generateVerificationPhoneToken(req.body.phoneNumber, req.body.origin,customer=true);
  // res.status(httpStatus.OK).send({ status: 200, message: "Saved", result: phoneLoginToken });
  res.sendStatus({ phoneLoginToken });
});

const verifyPhoneNumber = catchAsync(async (req, res) => {
  const verify = await authService.phoneVerify(req.body);
  // res.status(200).send({ status: 200, message: "", result: verify })
  res.sendStatus(verify);
})

const verifyPhoneAndEmail = catchAsync(async (req, res) => {
  const verify = await authService.verifyPhoneAndEmail(req.body);
  res.status(200).send({ status: 200, message: "", result: verify })
})

const adminDefaultAddress = catchAsync(async (req, res) => {
  const verify = await userService.adminDefaultAddress(req.body);
  // res.status(201).send();
  res.sendStatus(null, 201);
})

const userLogin = catchAsync(async (req, res) => {

  const { email, password, role } = req.body;
  const user = await authService.loginWithEmailAndPassword(email, password, role);
  const tokens = await tokenService.generateAuthTokens(user);
  // res.status(httpStatus.OK).send({ user, tokens });
  res.sendStatus({ user, tokens });
});

const apiKeyLogin = catchAsync(async (req, res) => {

  const user = await authService.apiKeyLogin(req.headers["bg-api-key"], req.headers["bg-secret-key"]);
  if (user.data && user.isSuccess) {
    const tokens = await tokenService.generateAuthTokens(user.data);
    // res.status(httpStatus.OK).send({ data: { userId: user.data.id, tokens }, isSuccess: true, status: 200, message: "" });
    res.sendStatus({ userId: user.data.id, tokens })
    // } else res.status(httpStatus.OK).send(user); 
  } else res.sendStatus(user.data, user.status, user.message);


});

const appleLogin = catchAsync(async (req, res) => {
  const user = await authService.appleLogin(req.body);
  // res.status(200).send(user);
  res.sendStatus(user);
});

const sellerFacebookLogin = catchAsync(async (req, res) => {
  const result = await authService.sellerFacebookLogin(req.body);
  // res.status(200).send(result);
  res.sendStatus(result);
})
const createRequestedSeller = catchAsync(async (req, res) => {
  const user = await authService.createRequestedSeller(req.body);
  const tokens = await tokenService.generateEmailPhonVerifAuthTokens(user);
  // res.status(httpStatus.CREATED).send({ user, tokens })
  res.sendStatus({ user, tokens });
});

const verifyEmail = catchAsync(async (req, res) => {
  const verify = await authService.verifyEmail(req.body, req.user);
  // res.status(200).send({ status: 200, message: "", result: verify })
  res.sendStatus(verify);

})

const verificationOfPhone = catchAsync(async (req, res) => {
  const verify = await authService.verificationOfPhone(req.body, req.user);
  // res.status(200).send({ status: 200, message: "", result: verify })
  res.sendStatus(verify);
})

const resendEmailCode = catchAsync(async (req, res) => {
  const user = await authService.resendEmailCode(req.body, req.user);
  const tokens = await tokenService.generateEmailPhonVerifAuthTokens(user);
  // res.status(httpStatus.CREATED).send({ user, tokens });
  res.sendStatus({ user, tokens });
})

const apiKeyRefreshTokens = catchAsync(async (req, res) => {

  const refreshtokens = await authService.refreshAuth(req.body.refreshToken);
  // res.status(httpStatus.OK).send({ ...tokens, user });
  res.sendStatus({ tokens: { access: refreshtokens.access, refresh: refreshtokens.refresh }, userId: refreshtokens?.user?.id });
});
module.exports = {
  registerUser,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  registerOrLoginFromEmail,
  emailLogin,
  sendVerificationEmail,
  emailVarification,
  defaultAddress,
  // smsCodeVarificationLogin,
  routeeValidation,
  sendVerificationSmsCode,
  facebookAuthentication,
  // isLoggedIn,
  registerRequestedSeller,
  smsCodeVarificationLogin,
  sendSmsCode,
  googleAuthentication,
  googleAuthenticationAndTokenGeneration,
  facebookAuthenticationAndTokenGeneration,
  current,
  facebookLogin,
  googleLogin,
  phoneLoginCode,
  verifyPhoneNumber,
  adminDefaultAddress,
  userLogin,
  apiKeyLogin,
  appleLogin,
  sellerFacebookLogin,
  verifyPhoneAndEmail,
  createRequestedSeller,
  verifyEmail,
  verificationOfPhone,
  resendEmailCode,
  apiKeyRefreshTokens
  ,
  publicRegisterSchool

};