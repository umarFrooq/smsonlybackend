const passport = require("passport");
const FacebookTokenStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const config = require("../../config/config");
const db = require("../../config/mongoose");
const User = db.User;
const { userTypes } = require("../../config/enums");

passport.use(new FacebookTokenStrategy({
        clientID: config.facebook.clientId,
        clientSecret: config.facebook.secretId,
        callbackURL: config.facebook.CALLBACK
    },
    async function(accessToken, refreshToken, profile, done) {
        const isExisting = await User.findOne({ facebookId: profile.id });
        if (isExisting) {
            return done(null, isExisting);
        }
        const newUser = await User.create({ facebookId: profile.id, userType: userTypes.FACEBOOK, fullname: profile.displayName });
        return done(null, newUser);
    }
));

passport.use(new GoogleStrategy({
        clientID: config.google.clientId,
        clientSecret: config.google.secretId,
        callbackURL: config.google.CALLBACK
    },
    async function(accessToken, refreshToken, profile, done) {
 
        const isExisting = await User.findOne({ googleId: profile.id });
        if (isExisting) {
            return done(null, isExisting);
        }
        const newUser = await User.create({ googleId: profile.id, userType: userTypes.GOOGLE, fullname: profile.displayName,isEmailVarified:true });
        return done(null, newUser);
    }
));