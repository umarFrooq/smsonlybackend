const db = require("@/config/mongoose");
const NotificationModel = db.NotificationModel;
const { createNew, find } = require("@/utils/generalDB.methods.js/DB.methods");


/**
 * createNotification
 * @param {object} body 
 * @returns {Promise<Product>}
 */
const createNotification = async (body) => {
    return await createNew(NotificationModel, body);
}

/**
 * createNotification
 * @param {ObjectId} userId --mongoose object id of user 
 * @param {object} options 
 * @returns {Promise<Product>}
 */
const findUserNotification = async (userId, options) => {
    return await find(NotificationModel, { userId: userId }, options);
}
module.exports = {
    createNotification,
    findUserNotification
};