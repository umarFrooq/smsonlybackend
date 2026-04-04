let routeeRequestPayload = {
    "method": "",
    "authentication": false,
    "url": "",
    "token": "",
    "contentType": "",
    "processData": false
}
let phoneNumberValidationPayload = {
    "getPorted": false,
    "to": "",
    "host": "https://api.bazaarghar.com/streaming/v1/callback"
}

let verificationCodePayload = {
    "method": "sms",
    "type": "code",
    "recipient": "",
    "template": "Your BazaarGhar code is @@pin",
    "originator": "BazaarGhar"
}
module.exports = { routeeRequestPayload, phoneNumberValidationPayload, verificationCodePayload };