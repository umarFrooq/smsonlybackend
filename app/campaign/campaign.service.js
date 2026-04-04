const Campaign = require("./campaign.model");
const { sendEmail } = require("../auth/email.service");
const db = require("../../config/mongoose");
const userService = require("../user/user.service");
const { emailType } = require("@/config/enums");
const ApiError = require("@/utils/ApiError");


/**
 * Generates and sends promotional emails based on the given request body.
 *
 * @param {Object} reqBody - The request body containing information about the email type, subject, body, and user details.
 * @return {Object} Returns the created campaign if successful.
 */
const promotionalEmail = async (reqBody) => {
    let to = [];
    let totalUsers = 0;
    if (reqBody.type === emailType.SUPPLIER || reqBody.type === emailType.USER) {
        if (reqBody.userId === undefined || reqBody.userId === null) {
            throw new ApiError("userId is required");
        }
        const user = await userService.getUserById(reqBody.userId)
        if (!user) throw new ApiError(400, "User not found.");
        if(user.role !==reqBody.type ) throw new ApiError(400, "User type not matched.");

        to = [user.email];

    }
    else if (reqBody.type === emailType.ALL || reqBody.type === emailType.SELLERS || reqBody.type === emailType.USERS) {
        let result = await reciever(reqBody.type)
        result = result[0].email
        if (!result || result.length === 0)
            throw new ApiError(400, "Not found.");
        to = result

    }
    if (to && to.length > 0) {
        for (const email of to) {
            try {
                await sendEmail(email, reqBody.subject, reqBody.body, true);
                totalUsers++;
            } catch (error) {
                console.error(`Failed to send email to ${email}:`, error);
            }
        }
    }
    if (totalUsers > 0) {
        const campaign = await Campaign.create({ ...reqBody, totalUsers });
        if (!campaign) throw new ApiError(400, "Campaign not created.");
        return campaign;
    }


    else {
        throw new ApiError(400, "Not found.");
    }

}

/**
 * A function that aggregates user emails based on the specified role.
 *
 * @param {string} role - the role to filter the user emails by
 * @return {Promise<Array>} A promise that resolves to an array of user emails
 */
const reciever = async (role) => {
    if (role === undefined || role === null) {
        throw new ApiError("role is required");
    }
    let pipeline = [];
    if (role === emailType.ALL)
        pipeline.push({ $match: { 'role': { $in: ['supplier', 'user'] } } });
    else {
        role = role === emailType.USERS ? 'user' : 'supplier';
        pipeline.push({ $match: { 'role': role } });
    }

    pipeline.push(
        {
            '$group': {
                '_id': null,
                'email': {
                    '$addToSet': '$email'
                }
            }

        },
        {
            '$project': {
                '_id': 0,
                'email': 1
            }
        }
    )


    return await db.User.aggregate(pipeline)


}

/**
 * Retrieve promotional emails from the Campaign collection asynchronously.
 *
 * @return {Promise} The result of the promotional emails retrieval
 */
const getPromotionalEmails = async (filter,options) => {
    const result = await Campaign.paginate(filter, options);
    if (!result) throw new ApiError(400, "Not found.");
    return result
}


/**
 * Retrieves a record by its ID.
 *
 * @param {string} id - The ID of the record to retrieve
 * @return {object} The retrieved record
 */
const getById  = async (id) => {
    const result = await Campaign.findById(id);
    if (!result) throw new ApiError(400, "Not found.");
    return result
}


module.exports = {
    promotionalEmail,
    getPromotionalEmails,
    getById
}