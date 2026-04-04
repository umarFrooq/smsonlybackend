const campaignService = require("./campaign.service");
const httpStatus = require("http-status");
const pick = require("../../utils/pick");


const promotionalEmail = async (req, res) => {
    const result = await campaignService.promotionalEmail(req.body);
    res.sendStatus(result);

}

const getPromotionalEmails = async (req, res) => {
    const filter = pick(req.query, ["type"]);
    const options = pick(req.query, ["sortBy", "limit", "page"]);
    const result = await campaignService.getPromotionalEmails(filter, options);
    res.send(result);
}

const getEmailById = async (req, res) => {
    const result = await campaignService.getById(req.params.id);
    res.send(result);
}
module.exports = {
    promotionalEmail, 
    getPromotionalEmails,
    getEmailById
}