const ApiError = require('../../utils/ApiError')
const Transaction = require('./transaction.model')
const httpStatus = require('http-status')
const { paymentMethods, transactionTypes, addOnTypes, roleTypes } = require('../../config/enums')
const { getSellerDetailAndSeller, findSellerDetailById } = require('../sellerDetail/sellerDetail.service')
const { dateFilter, parsetoObjectId } = require('../../config/components/general.methods')
const { paginationParser } = require('../../utils/generalDB.methods.js/DB.methods')
/**
 * Creates multiple transactions in the database.
 * @param {Array} transactions - An array of transaction objects to be inserted.

 * @returns {Promise<Array>} - A promise that resolves to an array of created transaction documents.
 */
let createTransaction = async (transactions) => {
    let result = await Transaction.insertMany(transactions)
    return result
}
/**
 * Finds a transaction by its order id.
 * @param {string} orderId - The id of the order whose transaction is to be retrieved.
 * @returns {Promise<Transaction>} - A promise that resolves to a transaction document.
 */
let getTransaction = async (orderId) => {
    let result = await fidOneTransaction({ orderId: orderId })
    return result
}
/**
 * Finds one transaction in the database.
 * @param {Object} filter - The filter query to find the transaction.
 * @returns {Promise<Transaction>} - A promise that resolves to a transaction document.
 */
let fidOneTransaction = async (filter) => {
    let result = await Transaction.findOne(filter)
    return result
}

/**
 * Retrieves a paginated list of transactions based on the given filter and options.
 *
 * @param {Object} filter - The filter query to find the transactions.
 * @param {Object} options - The options for pagination and sorting.
 *
 * @returns {Promise<Pagination<Transaction>>} - A promise that resolves to a pagination object containing the transaction documents and their count.
 */
const getTransactions = async (filter, options) => {
    return await Transaction.paginate(filter, options);
}

/**
 * Retrieves a paginated list of customer transactions based on the given filter and options.
 *
 * @param {Object} filter - The filter query to find the customer transactions.
 * @param {Object} options - The options for pagination and sorting.
 *
 * @returns {Promise<Pagination<Transaction>>} - A promise that resolves to a pagination object containing the customer transaction documents and their count.
 */
const getCustomerTransactions = async (filter, options, user) => {

    Object.assign(filter, { userId: user.id });
    const project = {
        adjusttedShipment: 0,
        premiumAmount: 0,
        vat: 0,
        forex: 0,
        premiumAmount: 0,
        commission: 0,
        basePrice: 0,
        commission: 0,
    }
    return await transactionQuery(filter, options, user.role, project)
}

/**
 * Retrieves a paginated list of seller transactions based on the given filter and options.
 *
 * @param {Object} filter - The filter query to find the seller transactions.
 * @param {Object} options - The options for pagination and sorting.
 *
 * @returns {Promise<Pagination<Transaction>>} - A promise that resolves to a pagination object containing the seller transaction documents and their count.
 */
const getSellerTransactions = async (filter, options, user) => {
    Object.assign(filter, { sellerId: user.id });
    // Object.assign(filter, { sellerId: "62613d7ac8642e319b9be33c" });
    return await transactionQuery(filter, options, user.role)
}

/**
 * Retrieves a paginated list of admin transactions based on the given filter and options.
 *
 * @param {Object} filter - The filter query to find the admin transactions.
 * @param {Object} options - The options for pagination and sorting.
 *
 * @returns {Promise<Pagination<Transaction>>} - A promise that resolves to a pagination object containing the admin transaction documents and their count.
 */

const getAdminTransactions = async (filter, options, user) => {
    return await transactionQuery(filter, options, user.role)
}

/**
 * Manual transaction from admin panel
 * @param {object} body - { sellerDetailId, amount }
 * @param {object} files - { transactionImages: [] }
 * @param {object} user - { id, fullname, email }
 * @returns {Promise<Transaction>}
 */
const manualTransaction = async (body, files, user) => {
    try {
        if (!files || !files.transactionImages || !files.transactionImages.length)
            throw new ApiError(httpStatus.BAD_REQUEST, "Transaction files are required.");
        const store = await findSellerDetailById(body.sellerDetailId);
        if (!store)
            throw new ApiError(httpStatus.BAD_REQUEST, "Store not found");
        body["sellerId"] = store.seller;
        body["images"] = files.transactionImages.map(img => img.location);
        body["paymentMethod"] = paymentMethods.MANUAL;
        body["type"] = transactionTypes.CREDIT;
        body["addOnType"] = addOnTypes.PLATFORM;
        body["adminId"] = user.id;
        body["userId"] = store.seller;
        body["admin"] = { fullname: user.fullname, email: user.email };
        return await newTransactions(body)
    } catch (err) {
        throw new ApiError(httpStatus.BAD_REQUEST, err.message);
    }
}

/**
 * Creates a new transaction
 * @param {Object} body - The transaction body
 * @return {Promise<Transaction>} - The new transaction
 */
const newTransactions = async (body) => {
    return await Transaction.create(body);
}

/**
 * Transaction query
 * @param {Object} filter - The filter query to find the transactions.
 * @param {Object} options - The options for pagination and sorting.
 * @param {string} role - The user role
 * @returns {Promise<Pagination<Transaction>>} - A promise that resolves to a pagination object containing the transaction documents and their count.
 */
const transactionQuery = async (filter, options, role, project) => {
    const objectIdParse = ['userId', 'orderId', 'orderDetailId', "sellerDetailId", "adminId", "sellerId"];
    parsetoObjectId(objectIdParse, filter);
    const pagination = paginationParser(options);
    filter = dateFilter(filter)
    if (!filter || !Object.keys(filter).length)
        filter = { _id: { $ne: null } };
    let query = [{
        '$match': filter
    }]
    if (project) {
        query.push({ "$project": project })
    }
    const facet = {
        '$facet': {
            'results': [
                {
                    '$sort': pagination.sort
                }, {
                    '$skip': pagination.skip
                }, {
                    '$limit': pagination.limit
                }
            ],
            'totalResults': [
                {
                    '$count': 'total'
                }
            ],
        }
    }
    if (role != roleTypes.USER) {
        facet.$facet["stats"] = [

            {
                '$group': {
                    '_id': null,
                    'commission': {
                        '$sum': '$commission'
                    },
                    'baseTotal': {
                        '$sum': '$basePrice'
                    },

                }
            }
        ]
        facet.$facet["paid"] = [
            { $match: { addOnType: "platform" } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: null,
                    lastPayment: { $first: "$createdAt" },
                    paid: {
                        $sum: "$amount"
                    }
                }
            }
        ]
    }

    query = [
        ...query, facet,
        {
            $unwind: {
                path: "$totalResults",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$paid",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$stats",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            '$addFields': {
                'page': pagination.page,
                'totalPages': { $ceil: { $divide: ['$totalResults.total', pagination.limit] } },
                'limit': pagination.limit
            }
        },
        {
            $project: {
                totalResults: "$totalResults.total",
                page: 1,
                totalPages: 1,
                limit: pagination.limit,
                results: '$results',
                stats: {
                    commission: 1,
                    baseTotal: 1,
                    paid: "$paid.paid",
                    unPaid: { $subtract: ["$stats.baseTotal", "$paid.paid"] },
                    lastPayment: "$paid.lastPayment"
                }

            }
        }
    ]
    console.log(JSON.stringify(query));
    let result = await Transaction.aggregate(query);
    result = result[0];
    if (result?.totalPages == null) {
        result.totalPages = 0;
        result.totalResults = 0
    }
    if (role == roleTypes.USER)
        delete result.stats
    return result

}
/**
 * Retrieves a paginated list of order transactions based on the given filter and options.
 * @param {Object} filter - The filter query to find the order transactions.
 * @param {Object} options - The options for pagination and sorting.
 * @returns {Promise<Pagination<Transaction>>} - A promise that resolves to a pagination object containing the order transaction documents and their count.
 */
const getFullOrderTransactions = async (filter, options) => {
    const objectIdParse = ['userId', 'orderId', 'orderDetailId', "sellerDetailId", "adminId", "sellerId"];
    parsetoObjectId(objectIdParse, filter);
    const pagination = paginationParser(options);
    filter = dateFilter(filter)
    if (!filter || !Object.keys(filter).length)
        filter = { _id: { $ne: null } };
    return await Transaction.aggregate(
        [
            {
                '$facet': {
                    'results': [
                        {
                            '$group': {
                                '_id': '$orderDetailId',
                                'createdAt': {
                                    '$first': '$createdAt'
                                },
                                'id': {
                                    '$first': '$_id'
                                },
                                'orderDetailId': {
                                    '$first': '$_id'
                                },
                                'total': {
                                    '$sum': '$amount'
                                },
                                'commission': {
                                    '$sum': '$commission'
                                },
                                'commission': {
                                    '$sum': '$forex'
                                },
                                'commission': {
                                    '$sum': '$vat'
                                },
                                'quantity': {
                                    '$sum': '$quantity'
                                }
                            }
                        }, {
                            '$sort': pagination.sort
                        }, {
                            '$skip': pagination.skip
                        }, {
                            '$limit': pagination.limit
                        }
                    ],
                    'totalResults': [
                        {
                            '$group': {
                                '_id': '$orderDetailId'
                            }
                        }, {
                            '$count': 'total'
                        }
                    ]
                }
            }, {
                '$unwind': {
                    'path': '$totalResults',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$addFields': {
                    'page': pagination.page,
                    'totalPages': { $ceil: { $divide: ['$totalResults.total', pagination.limit] } },
                    'limit': pagination.limit
                }
            }, {
                '$project': {
                    'totalResults': '$totalResults.total',
                    'page': 1,
                    'totalPages': 1,
                    'limit': pagination.limit,
                    'results': '$results'
                }
            }
        ]
    )
}
module.exports = {
    createTransaction,
    getTransaction,
    manualTransaction,
    getAdminTransactions,
    getCustomerTransactions,
    getSellerTransactions,
    getFullOrderTransactions
}