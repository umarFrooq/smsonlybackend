const firebaseService = require("./service");
const catchAsync = require("../../../utils/catchAsync");
const httpStatus = require("http-status");
const firebase = require("firebase")

const mobilePhone = catchAsync(async (req, res) => {
    const mobileVerfiy = await firebaseService.mobilePhone(req.query.phoneNumber);
    res.status(httpStatus.OK).send({ mobileVerfiy });
})

// const auth = firebase.auth();
// const url = 'https://your-cloud-function-url';


// const token = catchAsync(async () => {
//     const user = auth.currentUser;
//     const token = user && (await user.getIdToken());

//     const res = await fetch(url, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`,
//         },
//     });

//     return res.json();
// })
module.exports = { mobilePhone };
