const Joi = require('joi');
const { password } = require('./custom.validation');
const { objectId,emptyVal} = require("../auth/custom.validation");
const myCustomJoi = Joi.extend(require('joi-phone-number'));
const {roleTypes}=require('../../config/enums')
const register = {
  body: Joi.object().keys({
    email: Joi.string().email(),
    password: Joi.string().required().custom(password),
    fullname: Joi.string().required(),
    origin: Joi.object().keys({
      source: Joi.string(),
      version: Joi.string().allow(null),
    }),
    role:Joi.string().valid(...Object.values(roleTypes)).required(),
    branchId:Joi.string().custom(objectId),
    section:Joi.string(),
    status:Joi.string(),
    gradeId:Joi.string().custom(objectId).allow(null),
    cnic:Joi.string(),
    previousSchoolName : Joi.string().allow(""),
    gradeInPreviousSchool  : Joi.string().allow(''),
    migration:Joi.boolean()
  }),
};
const registerSeller = {

  body: Joi.object().keys({
    email: Joi.string().required().email(),
    phone: myCustomJoi.string().required().phoneNumber(),
    password: Joi.string().required().custom(password),
    fullname: Joi.string().required().custom(emptyVal),
    origin: Joi.object().keys({
      source: Joi.string(),
      version: Joi.string().allow(null)
    })
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};
const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};
const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};
const registerOrLoginFromEmail = {
  body: Joi.object().keys({
    email: Joi.string().required(),
  })
};

const publicRegisterSchool = {
  body: Joi.object().keys({
    schoolName: Joi.string().required(),
    adminName: Joi.string().required(),
    adminEmail: Joi.string().required().email(),
    adminPhone: myCustomJoi.string().phoneNumber().optional(),
    adminPassword: Joi.string().required().custom(password),
    totalStudents: Joi.number().optional(),
    totalTeachers: Joi.number().optional(),
    grades: Joi.array().items(Joi.string()).optional(),
    planType: Joi.string().optional()
  })
};
const emailLogin = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  })
};

const facebookLogin = {
  body: Joi.object().keys({
    facebookId: Joi.string().required(),
    displayName: Joi.string().min(3).max(50).required(),
    origin: Joi.object().keys({
      source: Joi.string(),
      version: Joi.string().allow(null)
    })
  })
};
const googleLogin = {
  body: Joi.object().keys({
    googleId: Joi.string().required(),
    displayName: Joi.string().required(),
    origin: Joi.object().keys({
      source: Joi.string(),
      version: Joi.string().allow(null)
    }),
    email: Joi.string()
  })
};
const sendVerificationEmail = {
  body: Joi.object().keys({
    email: Joi.string().required(),
  })
};
const emailVarification = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  })
};
const defaultAddress = {
  body: Joi.object().keys({
    addressId: Joi.string().required().custom(objectId),
    cartId: Joi.string().custom(objectId),
  })
};
const sendVerificationCode = {
  body: Joi.object().keys({
    phoneNumber: myCustomJoi.string().required().phoneNumber(),
  }),
};
const smsCodeVarificationLogin = {
  // query: Joi.object().keys({
  //     token: Joi.string().required(),
  // }),
  body: Joi.object().keys({
    phoneNumber: myCustomJoi.string().required().phoneNumber(),
    trackingId: Joi.string().required(),
    code: Joi.string().required(),
    phoneLoginToken: Joi.string().required(),
  }),
};
const createFacebookUser = {
  body: Joi.object().keys({
    facebookId: Joi.string().required(),
  }),
};
const createGoogleUser = {
  body: Joi.object().keys({
    googleId: Joi.string().required(),
  }),
}
const userAuthentication = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    // userId: Joi.string().required(),
  }),
}
const phoneNumberCode = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
    origin: Joi.object().keys({
      source: Joi.string(),
      version: Joi.string().allow(null)
    })
  }),
}

const verifyPhoneNumber = {
  body: Joi.object().keys({
    hash: Joi.string().required(),
    phoneToken: Joi.string().required()
  }),
}


const verifyPhoneEmail = {
  body: Joi.object().keys({
    emailCode: Joi.number().required(),
    phoneToken: Joi.string().required()
  }),
}

const adminDefaultAddress = {
  body: Joi.object().keys({
    addressId: Joi.string().required().custom(objectId),
    cartId: Joi.string().custom(objectId),
    userId: Joi.string().required().custom(objectId),
  })
};

const appleLogin = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    origin: Joi.object().keys({
      source: Joi.string(),
      version: Joi.string().allow(null)
    })
  })
};
const verifyEmail = {
  body: Joi.object().keys({
    emailCode: Joi.string().required()
  }),
}

const resendEmailCode = {
  body: Joi.object().keys({
    email: Joi.string().required().email()
  }),
}

const verificationOfPhone = {
  body: Joi.object().keys({
    phoneToken: Joi.string().required()
  }),
}
module.exports = {
  register,
  registerSeller,
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
  createFacebookUser,
  createGoogleUser,
  sendVerificationCode,
  smsCodeVarificationLogin,
  userAuthentication,
  facebookLogin,
  googleLogin,
  phoneNumberCode,
  verifyPhoneNumber,
  adminDefaultAddress,
  appleLogin,
  verifyPhoneEmail,
  verifyEmail,
  resendEmailCode,
  verificationOfPhone
  ,
  publicRegisterSchool

};
