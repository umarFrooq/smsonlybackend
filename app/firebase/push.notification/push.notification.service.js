const db = require("../../../config/mongoose");
const FirebaseTokenModel = db.FirebaseTokenModel;
const { createNew, updateById, findOne, find, findOneAndDelete } = require("@/utils/generalDB.methods.js/DB.methods");
const { sendNotification, sendMultipleCustomer, sendMultipleSeller, fcm, sendSingleNotificaiton } = require("./push.notification.utils");
const { createNotification } = require("./../../notifications/notification.service");
const { roleTypes } = require("@/config/enums");
const ApiError = require("@/utils/ApiError");
const en=require('../../../config/locales/en')


/**
 * create or update 
 * @param {Object} body
 * @returns {Promise<Custom>}
 */
const createOrUpdate = async (body) => {
    if (body.userId) {
        const findRecord = await findOne(FirebaseTokenModel, { userId: body.userId });
        if (findRecord.data)
            return await updateById(FirebaseTokenModel, findRecord.data._id, body);
        else
            return await createNew(FirebaseTokenModel, body);
    } else return await createNew(FirebaseTokenModel, body);
}


/**
 * get by userId 
 * @param {ObjectId} userId
 * @returns {Promise<Custom>}
 */

const getByUserId = async (userId) => {
    return await findOne(FirebaseTokenModel, { userId: userId });

};

const getAll = async () => {
    return await find(FirebaseTokenModel, {}, false);
}
/**
 * firebase notifications 
 * @param {Object} body --body of notification
 * @param {ObjectId} userId
 * @param {String} role
 * @returns {Promise<Custom>}
 */

const firebaseNotification = async (body, userId, role) => {
    if (userId && body) {
        // getting user firebase notification
        const userToken = await getByUserId(userId);
        if (userToken && userToken.isSuccess && userToken.data && userToken.data.token) {
            let result = await sendNotification(role, userToken.data.token, body);
            console.log(result);
            if (result.isSuccess && result.data && result.data.successCount == "1") {
                Object.assign(body, { userId: userId })
                await createNotification(body);
            }
        } else return userToken;
    } else return { isSuccess: false, status: 400, message:'PUSH_NOTIFICATION_MODULE.BODY_OR_USER_ID_MISSING' , data: {} };
};


const sendPushNotification = async (user, body, files) => {
    if (user && user.role === roleTypes.ADMIN) {
        // { path: "userId", match: { role: roleTypes.user } }
        const getTokens = await FirebaseTokenModel.find({}).limit(1000);
        let users = getTokens && getTokens.filter(user => user.app === "customer").map(user => user.token);
        const seller = getTokens && getTokens.filter(user => user.app === "seller").map(user => user.token);
        // let _user = getTokens.filter(tk => tk.userId && userId.role === roleTypes.USER);
        // console.log(getTokens);
        if (!users && !sellers) return { isSuccess: false, status: 400, message: 'PUSH_NOTIFICATION_MODULE.NO_USER_FOUND_TO_SEND_TOKEN', data: null };
        if (body.seller && body.customer) {

            if (users && users.length > 0) {
                await sendMultipleCustomer(user.role, users, { notification: { title: body.title, body: body.body } }, false);
            }
            if (seller && seller.length) {
                await sendMultipleSeller(user.role, seller, { notification: { title: body.title, body: body.body } });
            }
        } else if (body.seller && !body.customer) {
            await sendMultipleSeller(user.role, seller, { notification: { title: body.title, body: body.body } }, false);
        } else if (!body.seller && body.customer) {
            await sendMultipleCustomer(user.role, users, { notification: { title: body.title, body: body.body } });
        }
        return { status: 200, message: 'SEND_SUCCSESSFULLY', data: null, isSuccess: false }
        // console.log(getTokens);
    } else return { status: 403, message: 'FORBIDDEN', data: null, isSuccess: false }
}

const removeToken = async (userId) => {
    if (userId) {
        return await findOneAndDelete(FirebaseTokenModel, { userId: userId });
    } else return { status: 400, message: 'USER_ID_MISSING', data: null, isSuccess: false }
}

const fcmCustomer = async () => {
    return await fcm();
}

/**
 * get by userId 
 * @param {Object} payload --include payload and data {payload:{},data:{}}
 * @returns {Promise<Custom>}
 */

const sendOneNotification = async (payload, files) => {
    try {
        if (payload && payload.payload && payload.data) {
            if(files && files.notificationImage ){
                payload["data"]["imageUrl"]= files.notificationImage[0].location;
            }
            const token = await getByUserId(payload.payload.userId);
            console.log(token)
            if (token && token.data)
                // return await sendSingleNotificaiton(token.data.token, payload.payload, payload.data, payload.body);
                return await sendSingleNotificaiton(token.data.token, payload.payload, payload.data, payload.notificationMeta);
            else throw new ApiError(400, 'TOKEN_NOT_FOUND');
        } else throw new ApiError(400, 'PAYLOAD_OR_DATA_MISSING');
    } catch (err) {
        throw new ApiError(400, err.message);
    }
}
// const sendNotification =   async (body, userId, role) => {

// }
module.exports = {
    createOrUpdate,
    firebaseNotification,
    sendPushNotification,
    removeToken,
    fcmCustomer,
    sendOneNotification,
}