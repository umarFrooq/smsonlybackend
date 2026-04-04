
// const winston = require('winston');
// var { SumoLogic } = require('winston-sumologic-transport');
// const { logsCollector } = require("../config/config")

// var options = {
//   url: logsCollector
// };

// winston.add(new SumoLogic(options));

// const loger = (req, res, message, error) => {
//   try {
//     let logObj = {};
//     if (req.method != 'GET') {
//       if (error) {
//         logObj = {
//           ...error,
//           level: "error"
//         }
//       } else logObj = {
//         reqMethod: req.method,
//         endPoint: req.originalUrl,
//         body: req.body || req.query,
//         params: req.params && req.params,
//         ip: req.connection.remoteAddress,
//         userId: req.user && req.user.id || "",
//         userName: req.user && req.user.fullname || "",
//         resStatus: res.statusCode.toString(),
//         time: new Date().toUTCString(),
//         message: message,
//         level: "info",
//         service: "main"
//       }

//       winston.log(logObj);
//     }
//   }
//   catch (err) {
//     console.log(err);
//   }
// }


// module.exports = loger;
// // const winston = require('winston');
// // const path = require('path');

// // logFile = path.join(__dirname, "./operations.log");
// // errorFile = path.join(__dirname, "./error.log");

// // const logConfiguration = {
 
// //     'transports': [
// //         new winston.transports.File({
// //             filename: logFile,
// //             format: winston.format.json(),
// //             level: 'info'
// //         }),
// //     ],
// //      'format' : winston.format.json()
// // };

// // const logger = winston.createLogger(logConfiguration);

// // const loger = ( req, res, next)=>{
// //     try{
// //         logger.log({
// //             // Message to be logged
// //                 reqMethod: req.method,
// //                 endPoint:req.url,
// //                 ip: req.connection.remoteAddress,
// //                 userId: req.user && req.user._id || "",
// //                 userName: req.user && req.user.fullname || "",
// //                 resStatus: res.statusCode.toString(),
// //                 time: new Date().toLocaleString('en-US', {
// //                     timeZone: 'Asia/Karachi'
// //                 }),
// //                 level: "info"

// //             });
// //             return next();
// //     }
// //     catch(err){
// //         console.log(err);
// //     }
        
   
// // }

// // module.exports = loger;