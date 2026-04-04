const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const config = require("./config");
const mongoose = require('mongoose');
const db = require("../config/mongoose");
const { roleTypes } = require("./enums");
const { getSession } = require("@/app/session/session.service");
const User = db.User;
const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done, other = false) => {
  try {

    // const user = await User.aggregate([
    //   {
    //     '$match': {
    //       '_id': mongoose.Types.ObjectId(payload.sub)
    //     }
    //   }, {
    //     '$addFields': {
    //       'id': {
    //         '$toString': '$_id'
    //       }
    //     }
    //   }, {
    //     '$lookup': {
    //       'from': 'addresses', 
    //       'localField': 'defaultAddress', 
    //       'foreignField': '_id', 
    //       'pipeline': [
    //         {
    //           '$addFields': {
    //             'id': {
    //               '$toString': '$_id'
    //             }
    //           }
    //         }
    //       ], 
    //       'as': 'defaultAddress'
    //     }
    //   }, {
    //     '$unwind': {
    //       'path': '$defaultAddress', 
    //       'preserveNullAndEmptyArrays': true
    //     }
    //   }, {
    //     '$lookup': {
    //       'from': 'sellerdetails', 
    //       'localField': 'sellerDetail', 
    //       'foreignField': '_id', 
    //       'pipeline': [
    //         {
    //           '$addFields': {
    //             'id': {
    //               '$toString': '$_id'
    //             }
    //           }
    //         }
    //       ], 
    //       'as': 'sellerDetail'
    //     }
    //   }, {
    //     '$unwind': {
    //       'path': '$sellerDetail', 
    //       'preserveNullAndEmptyArrays': true
    //     }
    //   }, {
    //     '$lookup': {
    //       'from': 'rbacs', 
    //       'localField': 'role', 
    //       'foreignField': 'role', 
    //       'pipeline': [
    //         {
    //           '$project': {
    //             '_id': 0, 
    //             'access': 1
    //           }
    //         }
    //       ], 
    //       'as': 'access'
    //     }
    //   }, {
    //     '$unwind': {
    //       'path': '$access', 
    //       'preserveNullAndEmptyArrays': true
    //     }
    //   }, {
    //     '$set': {
    //       'access': '$access.access'
    //     }
    //   }, {
    //     '$project': {
    //       'password': 0
    //     }
    //   }
    // ]);
    if (payload.sub && payload.iat) {
      const validToken = await getSession(payload.sub, payload.iat);
      if (!validToken) {
        return done(null, false);
      }
    }
    let match = { _id: mongoose.Types.ObjectId(payload.sub) };
    const user = await User.aggregate([
      {
        '$match': match
      },
      {
        '$addFields': {
          'id': {
            '$toString': '$_id'
          }
        }
      }, {
        '$lookup': {
          'from': 'addresses',
          'localField': 'defaultAddress',
          'foreignField': '_id',
          'pipeline': [
            {
              '$addFields': {
                'id': {
                  '$toString': '$_id'
                }
              }
            }
          ],
          'as': 'defaultAddress'
        }
      }, {
        '$unwind': {
          'path': '$defaultAddress',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$lookup': {
          'from': 'sellerdetails',
          'localField': '_id',
          'foreignField': 'seller',
          'pipeline': [
            {
              '$addFields': {
                'id': {
                  '$toString': '$_id'
                }
              }
            }
          ],
          'as': 'sellerDetail'
        }
      }, {
        '$unwind': {
          'path': '$sellerDetail',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$lookup': {
          'from': 'rbacs',
          'localField': 'role',
          'foreignField': 'role',
          'pipeline': [
            {
              '$project': {
                '_id': 0,
                'access': 1
              }
            }
          ],
          'as': 'roleAccess'
        }
      }, {
        '$unwind': {
          'path': '$roleAccess',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$lookup': {
          'from': 'accesses',
          'localField': 'roleAccess.access',
          'foreignField': '_id',
          'as': 'accessDetails'
        }
      }, {
        '$set': {
          'access': {
            '$map': {
              'input': '$accessDetails',
              'as': 'accessDoc',
              'in': '$$accessDoc.name'
            }
          }
        }
      }, {
        '$project': {
          'accessDetails': 0,
          'roleAccess': 0
        }
      }
    ]);

    if (other) {
      if (user && user.length > 0) {
        delete user[0].password
        delete user[0].access
        return user[0]
      }
      else {
        return null
      }
    }
    // console.log(user[0])
    if (!user || user.length === 0) {
      return done(null, false);
    }
    const userObj = user[0];
    const allowUser = [roleTypes.USER, roleTypes.REQUESTED_SUPPLIER];
    // IMPORTANT: Removed the direct password check against payload.password
    // payload.password no longer exists, and this check was not standard for JWTs.
    // Token validity is based on signature and expiration. Session validity is handled by getSession.
    // if (userObj && !allowUser.includes(userObj.role)) // This condition seems specific
    //   if (userObj && userObj.role != roleTypes.USER) // and might need review based on app logic
    //     if (userObj.password !== payload.password) // This line is removed.
    //       throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized. Please try to login again');

    done(null, userObj);
  } catch (error) {
    done(error, false);
  }
};


const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
  jwtVerify
};
