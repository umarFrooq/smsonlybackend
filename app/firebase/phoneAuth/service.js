// var firebase = require("firebase/app");
// // Add the Firebase products that you want to use
// const { getAuth, signInWithPhoneNumber } = require("firebase/auth");
// require("firebase/firestore");
// var firebaseConfig = {
//     apiKey: "AIzaSyAYfrPkjmTG7WNl5c-S2tTS1pm847FXbJA",
//     authDomain: "bazaarghar.com",
//     projectId: "bazaarghar",
//     storageBucket: "bazaarghar.appspot.com",
//     messagingSenderId: "803226185929",
//     appId: "1:803226185929:web:6e17f959433176c241dd18",
//     measurementId: "G-3MHKMDFL01"
// };
// firebase.initializeApp(firebaseConfig);
// // const appVerifier = window.recaptchaVerifier;
// const mobilePhone = (phoneNumber) => {
//     var applicationVerifier = new firebase.auth.RecaptchaVerifier(
//         'recaptcha-container');
//     var provider = new firebase.auth.PhoneAuthProvider();
//     provider.verifyPhoneNumber(phoneNumber, applicationVerifier)
//         .then(function(verificationId) {
//           var verificationCode = window.prompt('Please enter the verification ' +
//               'code that was sent to your mobile device.');
//           return firebase.auth.PhoneAuthProvider.credential(verificationId,
//               verificationCode);
//         })
//         .then(function(phoneCredential) {
//           return firebase.auth().signInWithCredential(phoneCredential);
//         });
//     // const appVerifier = this.recaptchaVerifier;
//     // firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier)
//     //     .then((confirmationResult) => {
//     //         // SMS sent. Prompt user to type the code from the message, then sign the
//     //         // user in with confirmationResult.confirm(code).
//     //         console.log(confirmationResult);
//     //         window.confirmationResult = confirmationResult;
//     //         // ...
//     //     }).catch((error) => {
//     //         console.log(error)
//     //     });
// }

const ApiError = require("@/utils/ApiError");

let firebaseVerifTok = async (token) => {

  let firebaseApp = null;
  var admin = require("firebase-admin");
  var serviceAcount = require("./firebaseadmin.json");
  var serviceApp = "auth";
  // const app = !admin.apps.length ? admin.initializeApp({ credential: admin.credential.cert(serviceAcount) }) : admin.app();
  const app = admin.apps.length && admin.apps.find(app => app.name === serviceApp) || admin.initializeApp({ credential: admin.credential.cert(serviceAcount) }, serviceApp);
  // const { getAuth } = require("firebase-admin/auth")
  let getauth = app.auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      return decodedToken.phone_number;
    })
    .catch((error) => {
      throw new ApiError(400, error.message)
    });

  return getauth;
}
// module.exports = { mobilePhone ,firebaseVerifTok}
module.exports = { firebaseVerifTok }
