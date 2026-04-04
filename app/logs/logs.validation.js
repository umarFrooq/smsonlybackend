const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");

const filterLogs = {
    query : Joi.object().keys({
        reqMethod : Joi.string().valid("GET","PUT", "POST", "PATCH", "DELETE"),
        resStatus : Joi.string(),
        endPoint : Joi.string(),
        userId : Joi.string().custom(objectId),
        userName : Joi.string(),
        to : Joi.date(),
        from : Joi.date()
    })
}
                                                                   
module.exports = {
    filterLogs
}