
let checkoutService = require('./checkout.service')

let createSession = async (req, res) => {
    const result = await checkoutService.createSession(req.body)
    res.sendStatus(result);
}
let webHook = async (req, res) => {
    const result = await checkoutService.webHook(req.body)
    res.sendStatus(result);
}
module.exports = {
    createSession,
    webHook
}