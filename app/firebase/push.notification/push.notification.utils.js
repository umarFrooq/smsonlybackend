// var admin = require("firebase-admin");

const { roleTypes } = require("@/config/enums");
const { domainName } = require("../../../config/config");
const config = require("../../../config/config");
const en=require('../../../config/locales/en.json')
// var payload = {
//     notification: {
//         title: "Account Deposit",
//         body: "A deposit to your savings account has just cleared."
//     },
//     data: {
//         account: "Savings",
//         balance: "$3020.25"
//     }
// };

var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
};

/**
 * Firebase push notification
 * @param {String} role
 * @param {String} token --firebase token
 * @param {Object} payload --notification detail
 * @param {Object} data
 * @returns {Promise<CustomeResponse>} --including status,success,data
 */
const sendNotification = async (role, token, params, data) => {
    payload = {
        notification: {
            title: params.title || "",
            body: params.body || "",
        }
    };
    if(params.imageUrl){
        payload["notification"]["imageUrl"] = params.imageUrl
    }
    if (data)
        payload["data"] = data;
    if (data && data.slug) {
        // payload.notification["click_action"] = "https://bazaarghar.com/video/" + data.slug;
        payload["webpush"] = {
            fcmOptions: {
                link: domainName + "video/" + data.slug
            }
        }
    }

    // firebase sdk integration
    var admin = require("firebase-admin");
    let serviceAccount;
    let serviceApp;
    // seller and customer firebase admin sdk files path
    var serviceAccountSeller = require("./bazaarghar-seller-firebase-adminsdk-i4g3g-c8f15ef7c3.json");
    var serviceAccountCustomer = require("./bazaarghar-app-firebase-adminsdk-2tdkp-9bd280704a.json");
    console.log(serviceAccountSeller.name);
    if (role == roleTypes.USER){
        serviceAccount = serviceAccountCustomer
        serviceApp = role
    }
    else if (role == roleTypes.SUPPLIER || role == roleTypes.SUPPLIER){
        serviceAccount = serviceAccountSeller
        serviceApp = role
    }
    // const app = !admin.apps.length ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, serviceApp) : admin.app();
    const app = admin.apps.length && admin.apps.find(app => app.name === serviceApp) || admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, serviceApp);
    payload["token"] = token;
    if (!payload.data)
        delete payload.data;
    return app.messaging().send(payload)
        .then(function (response) {
            if (response && response.failureCount)
                return { status: 400, message: 'PUSH_NOTIFICATION_MODULE.FIREBASE_NOTIFICATION_ERROR', data: response, isSuccess: false }
            return { status: 200, message: 'CustomPUSH_NOTIFICATION_MODULE.NOTIFICATION_SENT', data: response, isSuccess: true };
        })
        .catch(function (error) {
            return { status: 400, message: 'PUSH_NOTIFICATION_MODULE.NOTIFICATION_COULD_NOT_BE_SENT', data: error, isSuccess: false };
        });
}

const sendMultipleCustomer = async (role, tokens, body) => {
    if (role == roleTypes.ADMIN) {
        if (tokens && tokens.length > 0) {
            if (body && body.notification && body.notification.title && body.notification.body) {
                // let app;
                var admin = require("firebase-admin");
                // seller and customer firebase admin sdk files path
                var serviceAccountCustomer = require("./bazaarghar-app-firebase-adminsdk-2tdkp-9bd280704a.json");
                if (!admin.apps.length) {
                    const app = admin.apps.length && admin.apps.find(app => app.name === "user") || admin.initializeApp({ credential: admin.credential.cert(serviceAccountCustomer) }, "user");
                    if (app) {
                        return app.messaging().sendToDevice(tokens, body, options)
                            .then(function (response) {
                                return { status: 200, message:'PUSH_NOTIFICATION_MODULE.NOTIFICATION_SENT', data: response, isSuccess: true };
                            })
                            .catch(function (error) {
                                return { status: 400, message: 'PUSH_NOTIFICATION_MODULE.NOTIFICATION_COULD_NOT_BE_SENT', data: error, isSuccess: false };
                            });
                    } else return { status: 400, message: 'SOME_THING_WENT_WRONG', data: null, isSuccess: false };
                }
                // const app = seller && !admin.apps.length ? admin.initializeApp({ credential: admin.credential.cert(serviceAccountSeller) }) : admin.initializeApp({ credential: admin.credential.cert(serviceAccountCustomer) });
                // if (app) {
                //     return app.messaging().sendToDevice(tokens, body, options)
                //         .then(function (response) {
                //             return { status: 200, message: "notification sent successfuly", data: response, isSuccess: true };
                //         })
                //         .catch(function (error) {
                //             return { status: 400, message: "notification could not be sent", data: error, isSuccess: false };
                //         });
                // } else return { status: 400, message: "Something went wrong", data: null, isSuccess: false };
            } else return { status: 400, message: 'NOTIFICATION_DATA_IS_MISSING', data: null, isSuccess: false }
        } else return { status: 400, message: 'ADMINTOKEN_NOT_FOUND', data: null, isSuccess: false }
    } else return { status: 403, message: 'FORBIDDEN', data: null, isSuccess: false }
}

const sendMultipleSeller = async (role, tokens, body) => {

    if (role == roleTypes.ADMIN) {
        if (tokens && tokens.length > 0) {
            if (body && body.notification && body.notification.title && body.notification.body) {
                // let app;
                var admin = require("firebase-admin");
                // seller and customer firebase admin sdk files path
                var serviceAccountSeller = require("./bazaarghar-seller-firebase-adminsdk-i4g3g-c8f15ef7c3.json");
                // if (!admin.apps.length) {
                // const app = !admin.apps.length && admin.initializeApp({ credential: admin.credential.cert(serviceAccountSeller) }, config.firebase.sellerApp);
                const app = admin.apps.length && admin.apps.find(app => app.name === "supplier") || admin.initializeApp({ credential: admin.credential.cert(serviceAccountSeller) }, "supplier");
                if (app) {
                    return app.messaging().sendToDevice(tokens, body, options)
                        .then(function (response) {
                            return { status: 200, message: 'PUSH_NOTIFICATION_MODULE.NOTIFICATION_SENT', data: response, isSuccess: true };
                        })
                        .catch(function (error) {
                            return { status: 400, message: 'PUSH_NOTIFICATION_MODULE.NOTIFICATION_COULD_NOT_BE_SENT', data: error, isSuccess: false };
                        });
                } else return { status: 400, message:'SOME_THING_WENT_WRONG', data: null, isSuccess: false };
                // }
                // const app = seller && !admin.apps.length ? admin.initializeApp({ credential: admin.credential.cert(serviceAccountSeller) }) : admin.initializeApp({ credential: admin.credential.cert(serviceAccountCustomer) });
                // if (app) {
                //     return app.messaging().sendToDevice(tokens, body, options)
                //         .then(function (response) {
                //             return { status: 200, message: "notification sent successfuly", data: response, isSuccess: true };
                //         })
                //         .catch(function (error) {
                //             return { status: 400, message: "notification could not be sent", data: error, isSuccess: false };
                //         });
                // } else return { status: 400, message: "Something went wrong", data: null, isSuccess: false };
            } else return { status: 400, message: 'NOTIFICATION_DATA_IS_MISSING', data: null, isSuccess: false }
        } else return { status: 400, message: 'TOKEN_NOT_FOUND', data: null, isSuccess: false }
    } else return { status: 403, message: 'FORBIDDEN', data: null, isSuccess: false }
}

const fcm = async () => {
    var admin = require("firebase-admin");
    const app = admin.initializeApp()
    const messaging = app.getMessaging();
    // const app = admin.initializeApp();
    // seller and customer firebase admin sdk files path
    // var serviceAccountCustomer = require("./bazaarghar-app-firebase-adminsdk-2tdkp-9bd280704a.json");
    // const messaging = appgetMessaging();
    app.getToken(messaging, { vapidKey: 'BB26ztTTTUVd_xMsmWA1GfutasRKABY-8ZloUwrNL1v7VQNGBHjzm3Z8qckSkLBZPIqPjKkxBCqOt-SEVf0J04E' }).then((currentToken) => {
        if (currentToken) {
            console.log(currentToken);
        } else {
            // Show permission request UI
            console.log('No registration token available. Request permission to generate one.');
            // ...
        }
    }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
        // ...
    });
}

/**
 * get by userId
 * @param {String} token --firebase token 
 * @param {Object} payload --include payload(userId and role)
 * @param {Object} data --notification data (title and body)

 * @returns {Promise<Custom>}
 */
const sendSingleNotificaiton = async (token, payload, data, body) => {
    if (payload && payload.userId && data) {
        return await sendNotification(payload.role, token, data, body);
    } else throw new ApiError(400, 'PUSH_NOTIFICATION_MODULE.NOTIFICATION_DATA_OR_USER_ID_MISSING');
}

module.exports = {
    sendNotification,
    sendMultipleCustomer,
    sendMultipleSeller,
    fcm,
    sendSingleNotificaiton
};