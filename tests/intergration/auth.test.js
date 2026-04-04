const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const app = require('../../config/express');
const config = require('../../config/config');
const auth = require('../../middlewares/auth');
const tokenService =require('../../app/auth/token.service')
const emailService =require('../../app/auth/email.service')
const ApiError = require('../../utils/ApiError');
const setupTestDB = require('../utils/setupTestDB');
const db = require("../../config/mongoose");

const { tokenTypes } = require('../../config/token');
const { roleRights } = require('../../config/roles');
const { userOne,userTwo, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');

setupTestDB();
const User = db.User;
const Token = db.Token;
describe('Auth routes', () => {
  describe('POST /v1/auth/register', () => {
    let newUser;
    beforeEach(() => {
      newUser = {
        fullname: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        
      };
    });

    test('should return 201 and successfully register user if request data is ok', async () => {
      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toEqual({ 
        id: expect.anything(), fullname: newUser.fullname, 
        email: newUser.email, isEmailVarified: false, isPhoneVarified: false,
        isEmailVarified: false,role: 'user',
        userType:"local",
        //,
      //  addresses:expect.any(Array)
       });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({ fullname: newUser.fullname, email: newUser.email, role: 'user' ,
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      newUser.password = '11111111';

      await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
  });
  describe('POST /v1/auth/registerSeller', () => {
    let newUser;
    beforeEach(() => {
      newUser = {
        fullname: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        phone: '+923018324487',
        password: 'password1',
        
      };
    });

    test('should return 201 and successfully register user if request data is ok', async () => {
      const res = await request(app).post('/v1/auth/registerSeller')
      .send(newUser).expect(httpStatus.CREATED);

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('phone');
      expect(res.body.user).toEqual({ 
        id: expect.anything(), 
        fullname: newUser.fullname, 
        email: newUser.email, 
       // phone: newUser.phone,
        isEmailVarified: false, 
        isPhoneVarified: true,
        //,
        role: 'requestedSeller',
        userType:"local",
        //addresses:expect.any(Array)
       });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({ 
        fullname: newUser.fullname,
         email: newUser.email,
         phone: newUser.phone,
          role: 'requestedSeller'
         });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';

      await request(app).post('/v1/auth/registerSeller').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
    test('should return 400 error if phone is invalid', async () => {
      newUser.phone = 'invalidPhone';

      await request(app).post('/v1/auth/registerSeller').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app).post('/v1/auth/registerSeller').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
    test('should return 400 error if phone is already used', async () => {
      await insertUsers([userOne]);
      newUser.phone = userOne.phone;

      await request(app).post('/v1/auth/registerSeller').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      await request(app).post('/v1/auth/registerSeller').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';

      await request(app).post('/v1/auth/registerSeller').send(newUser).expect(httpStatus.BAD_REQUEST);

      newUser.password = '11111111';

      await request(app).post('/v1/auth/registerSeller').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/login', () => {
    test('should return 200 and login user if email and password match', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.OK);

      expect(res.body.user).toEqual({
        id: expect.anything(),
        fullname: userOne.fullname,
        email: userOne.email, 
        isEmailVarified: false,
        isPhoneVarified: false,
        role: userOne.role,
        userType:"local",
        //,
       // addresses:expect.any(Array)
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 401 error if there are no users with that email', async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
    });

    test('should return 401 error if password is wrong', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: 'wrongPassword1',
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
    });
  });

  describe('POST /v1/auth/refresh-tokens', () => {
    test('should return 200 and new auth tokens if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.OK);
      

      expect(res.body).toEqual({
        user:{id: expect.anything(),
          fullname: userOne.fullname,
          email: userOne.email, 
          isEmailVarified: false,
          isPhoneVarified: false,
          role: userOne.role,
          userType:"local",
       
        //  addresses:expect.any(Array)
        },
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbRefreshTokenDoc = await Token.findOne({ token: res.body.refresh.token });
      expect(dbRefreshTokenDoc).toMatchObject({ type: tokenTypes.REFRESH, user: userOne._id, blacklisted: false });

      const dbRefreshTokenCount = await Token.countDocuments();
      expect(dbRefreshTokenCount).toBe(1);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      await request(app).post('/v1/auth/refresh-tokens').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 error if refresh token is signed using an invalid secret', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, 'invalidSecret');
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const refreshToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if user is not found', async () => {
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    beforeEach(() => {
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
    });

    test('should return 204 and send reset password email to the user', async () => {
      await insertUsers([userOne]);
      const sendResetPasswordEmailSpy = jest.spyOn(emailService, 'sendResetPasswordEmail');

      await request(app).post('/v1/auth/forgot-password').send({ email: userOne.email }).expect(httpStatus.NO_CONTENT);

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
      const dbResetPasswordTokenDoc = await Token.findOne({ token: resetPasswordToken, user: userOne._id });
      expect(dbResetPasswordTokenDoc).toBeDefined();
    });

    test('should return 400 if email is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v1/auth/forgot-password').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if email does not belong to any user', async () => {
      await request(app).post('/v1/auth/forgot-password').send({ email: userOne.email }).expect(httpStatus.NOT_FOUND);
    });
  });

  describe('POST /v1/auth/reset-password', () => {
    test('should return 204 and reset the password', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      const isPasswordMatch = await bcrypt.compare('password2', dbUser.password);
      expect(isPasswordMatch).toBe(true);

      const dbResetPasswordTokenCount = await Token.countDocuments({ user: userOne._id, type: tokenTypes.RESET_PASSWORD});
      expect(dbResetPasswordTokenCount).toBe(0);
    });

    test('should return 400 if reset password token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v1/auth/reset-password').send({ password: 'password2' }).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 if reset password token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD, true);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if reset password token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if password is missing or invalid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app).post('/v1/auth/reset-password').query({ token: resetPasswordToken }).expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'short1' })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password' })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: '11111111' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/registerOrLoginFromEmail', () => {
    beforeEach(() => {
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
    });

    test('should return 204 and send verification email to the user', async () => {
      await insertUsers([userOne]);
      const sendLoginEmailSpy = jest.spyOn(emailService, 'sendLoginEmail');

      await request(app).post('/v1/auth/registerOrLoginFromEmail').send({ email: userOne.email }).expect(httpStatus.NO_CONTENT);

      expect(sendLoginEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
      const loginEmailToken = sendLoginEmailSpy.mock.calls[0][1];
      const dbLoginEmailTokenDoc = await Token.findOne({ token: loginEmailToken, user: userOne._id });
   
      expect(dbLoginEmailTokenDoc).toBeDefined();
    });
    test('if no user is registered with email then it should return 204 and send verification email to the user', async () => {
      
      const sendLoginEmailSpy = jest.spyOn(emailService, 'sendLoginEmail');

   await request(app).post('/v1/auth/registerOrLoginFromEmail').send({ email: userOne.email }).expect(httpStatus.NO_CONTENT);

      expect(sendLoginEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
      const loginEmailToken = sendLoginEmailSpy.mock.calls[0][1];
      const dbLoginEmailTokenDoc = await Token.findOne({ token: loginEmailToken});
       expect(dbLoginEmailTokenDoc).toBeDefined();
    });
    test('should return 400 if email is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v1/auth/registerOrLoginFromEmail').send().expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/login-email', () => {
    test('should return 204 and login with the Email', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.registerOrLoginFromEmailTokenExpirationMinutes, 'minutes');
      const loginEmailToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(loginEmailToken, userOne._id, expires, tokenTypes.Register_Or_Login);

      await request(app)
        .post('/v1/auth/login-email')
        .query({ token: loginEmailToken })
        .send()
        .expect(httpStatus.CREATED);

      
      const dbLoginEmailTokenCount = await Token.countDocuments({ user: userOne._id, type: tokenTypes.Register_Or_Login });
      expect(dbLoginEmailTokenCount).toBe(0);
    });
    

    test('should return 400 if login email  token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v1/auth/login-email').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 if  login email is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.registerOrLoginFromEmailTokenExpirationMinutes, 'minutes');
      const loginEmailToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(loginEmailToken, userOne._id, expires, tokenTypes.Register_Or_Login, true);

      await request(app)
        .post('/v1/auth/login-email')
        .query({ token: loginEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if login email token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const loginEmailToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(loginEmailToken, userOne._id, expires, tokenTypes.Register_Or_Login);

      await request(app)
        .post('/v1/auth/login-email')
        .query({ token: loginEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.registerOrLoginFromEmailTokenExpirationMinutes, 'minutes');
      const loginEmailToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(loginEmailToken, userOne._id, expires, tokenTypes.Register_Or_Login);

      await request(app)
        .post('/v1/auth/login-email')
        .query({ token: loginEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
  describe('POST /v1/auth/send-verification', () => {
    beforeEach(() => {
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
    });

    // test('should return 204 and send verification email to the user', async () => {
    //   await insertUsers([userOne]);
    //   const sendVerificationEmaillSpy = jest.spyOn(emailService, 'sendVerificationEmail');

    //   await request(app).post('/v1/auth/send-verification').send({ email: userOne.email }).expect(httpStatus.NO_CONTENT);

    //   expect(sendVerificationEmaillSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
    //   const VerificationEmailToken = sendVerificationEmaillSpy.mock.calls[0][1];
    //   const dbVerificationEmailTokenDoc = await Token.findOne({ token: VerificationEmailToken, user: userOne._id });
   
    //   expect(dbVerificationEmailTokenDoc).toBeDefined();
    // });
   
    // test('should return 400 if email is missing', async () => {
    //   await insertUsers([userOne]);

    //   await request(app).post('/v1/auth/send-verification').send().expect(httpStatus.BAD_REQUEST);
    // });
    test('should return 404 if email does not belong to any user', async () => {
      await request(app).post('/v1/auth/send-verification').send({ email: userOne.email }).expect(httpStatus.NOT_FOUND);
    });
  });
  describe('POST /v1/auth/email-verification', () => {
    test('should return 204 and verify the email', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.verificationEmailExpirationMinutes, 'minutes');
      const verificationEmailToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(verificationEmailToken, userOne._id, expires, tokenTypes.Verification_Email);

      await request(app)
        .post('/v1/auth/email-verification')
        .query({ token: verificationEmailToken })
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      
      expect(dbUser.isEmailVarified).toBe(true);

      const dbVerificationEmailTokenCount = await Token.countDocuments({ user: userOne._id, type: tokenTypes.Verification_Email });
      expect(dbVerificationEmailTokenCount).toBe(0);
    });

    test('should return 400 if email verification token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v1/auth/email-verification').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 if verification email token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.verificationEmailExpirationMinutes, 'minutes');
      const verificationEmailToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(verificationEmailToken, userOne._id, expires, tokenTypes.Verification_Email, true);

      await request(app)
        .post('/v1/auth/email-verification')
        .query({ token: verificationEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if email verification token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const verificationEmailToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(verificationEmailToken, userOne._id, expires, tokenTypes.Verification_Email);

      await request(app)
        .post('/v1/auth/email-verification')
        .query({ token: verificationEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.verificationEmailExpirationMinutes, 'minutes');
      const verificationEmailToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(verificationEmailToken, userOne._id, expires, tokenTypes.Verification_Email);

      await request(app)
        .post('/v1/auth/email-verification')
        .query({ token: verificationEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    
  });
  describe('POST /v1/auth/logout', () => {
    test('should return 204 if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NO_CONTENT);

      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      await request(app).post('/v1/auth/logout').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });
  });

});

  describe('POST /v1/auth/logout', () => {
    test('should return 204 if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NO_CONTENT);

      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      await request(app).post('/v1/auth/logout').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });
  });


describe('Auth middleware', () => {
  test('should call next with no errors if access token is valid', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user._id).toEqual(userOne._id);
  });

  test('should call next with unauthorized error if access token is not found in header', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    await insertUsers([userOne]);
    const tokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, tokenExpires, 'invalidSecret');
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    await insertUsers([userOne]);
    const tokenExpires = moment().subtract(1, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, tokenExpires);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if user is not found', async () => {
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with forbidden error if user does not have required rights and userId is not in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth('anyRight')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: httpStatus.FORBIDDEN, message: 'Forbidden' }));
  });

  test('should call next with no errors if user does not have required rights but userId is in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
      params: { userId: userOne._id.toHexString() },
    });
    const next = jest.fn();

    await auth('anyRight')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should call next with no errors if user has required rights', async () => {
    await insertUsers([admin]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      params: { userId: userOne._id.toHexString() },
    });
    const next = jest.fn();

    await auth(...roleRights.get('admin'))(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });
});