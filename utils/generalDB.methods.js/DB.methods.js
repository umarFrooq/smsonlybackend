const ApiError = require("../../utils/ApiError");
const en=require('../../config/locales/en')
/**
 * Create
 * @param {Schema} schema - Mongo schema
 * @param {Object} body - body 
 */

const createNew = async (schema, body, session) => {
    if (session)
        return await schema.create(body, { session }).then(result => {
            return { status: 200, isSuccess: true, data: result, message: 'CREATED_SUCCESSFULLY'}
        }).catch(err => {
            return { status: 400, isSuccess: false, data: null, message: (err && err.code && err.code == 11000 ? 'DUPLICATE_VALUE_IS_NOT_ALLOWED': 'CREATION_UN_SUCCESSFULL') }
        });
    else return await schema.create(body).then(result => {
        return { status: 200, isSuccess: true, data: result, message: 'CREATED_SUCCESSFULLY' }
    }).catch(err => {
        return { status: 400, isSuccess: false, data: null, message: (err && err.code && err.code == 11000 ? 'DUPLICATE_VALUE_IS_NOT_ALLOWED' : 'CREATION_UN_SUCCESSFULL') }
    });
}

/**
 * Find
 * @param {Schema} schema - Mongo schema
 * @param {Object} filter - queries 
 * @param {Object} options - mongoose filter options e.g pageNo,limit, sorting 
 */
const find = async (schema, filter, options, pagination = true) => {
    if (pagination) {
        return await schema.paginate(filter, options).then(result => {
            return { status: 200, isSuccess: true, data: result, message: "ok" }
        }).catch(err => {
            return { status: 400, isSuccess: false, data: null, message: err }
        });
    } else if (!pagination) {
        if (options && options.lean) {
            return await schema.find(filter).lean().then(result => {
                return { status: 200, isSuccess: true, data: result, message: "ok" }
            }).catch(err => {
                return { status: 400, isSuccess: false, data: null, message: err }
            });
        } else {
            return await schema.find(filter).then(result => {
                return { status: 200, isSuccess: true, data: result, message: "ok" }
            }).catch(err => {
                return { status: 400, isSuccess: false, data: null, message: err }
            });
        }
    }

}

/**
 * Delete By Id
 * @param {Schema} schema - Mongo schema
 * @param {ObjectId} id - Mongo objectId 
  */

const deleteById = async (schema, id) => {
    return await schema.findByIdAndDelete(id).then(result => {
        return { status: 200, isSuccess: true, data: result, message: 'DELETED_SUCCESSFULLY'}
    }).catch(err => {
        return { status: 400, isSuccess: false, data: null, message: err }
    });
}

/**
 * Update Document
 * @param {Schema} schema - Mongo schema
 * @param {ObjectId} id - Mongo objectId 
 * @param {object} body - body
  */
const updateById = async (schema, _id, body, session) => {
    if (session)
        return await schema.findByIdAndUpdate(_id, body, { new: true }, { session }).then(result => {
            return { status: 200, isSuccess: true, data: result, message:'UPDATED' }
        }).catch(err => {
            return { status: 400, isSuccess: false, data: null, message: err }
        });
    else
        return await schema.findByIdAndUpdate(_id, body, { new: true }).then(result => {
            return { status: 200, isSuccess: true, data: result, message:'UPDATED' }
        }).catch(err => {
            return { status: 400, isSuccess: false, data: null, message: err }
        });
}



const updateOne = async (schema, _id, body) => {
    return await schema.findOneAndUpdate(_id, body, { returnNewDocument: true }).then(result => {
        return { status: 200, isSuccess: true, data: result, message:'UPDATED' }
    }).catch(err => {
        return { status: 400, isSuccess: false, data: null, message: err }
    });
}

const updateOneByFilter = async (schema, filter, body) => {
    return await schema.findOneAndUpdate(filter, body, { new: true }).then(result => {
        return { status: 200, isSuccess: true, data: result, message: 'UPDATED' }
    }).catch(err => {
        return { status: 400, isSuccess: false, data: null, message: err }
    });
}



const updateMany = async (schema, filter, body) => {
    return await schema.updateMany(filter, body, { new: true }).then(result => {
        return { status: 200, isSuccess: true, data: result, message: 'UPDATED' }
    }).catch(err => {
        return { status: 400, isSuccess: false, data: null, message: err }
    });
}

const findById = async (schema, id) => {
    return await schema.findById(id).then(result => {
        if (!result)
            return { status: 404, isSuccess: false, data: null, message:'NOT_FOUND'}
        return { status: 200, isSuccess: true, data: result ? result : null, message: "ok" }
    }).catch(err => {
        return { status: 400, isSuccess: false, data: null, message: 'SERVER_ERROR' }
    });
}

const getBySlug = async (schema, slug) => {
    return await schema.find({ slug }).then(result => {
        return { status: 200, isSuccess: true, data: result ? result : null, message: "ok" }
    }).catch(err => {
        return { status: 400, isSuccess: false, data: err, message: 'SERVER_ERROR' }
    });
}

const findOne = async (schema, filter) => {
    return await schema.findOne(filter).then(result => {
        return { status: 200, isSuccess: true, data: result ? result : null, message: "ok" };
    }).catch(err => {
        return { status: 400, isSuccess: false, data: err, message: 'SERVER_ERROR' };
    });
}
// const updateManyById = async (schema, id, body) => {
// await schema.updateManyById({})
// }
const createMany = async (schema, dataArray) => {
    if (dataArray) {
        console.log(dataArray)
        return schema.insertMany(dataArray).then(result => {
            return { status: 200, isSuccess: true, data: result, message: "" };
        }).catch(err => {
            console.log(err);
            return { status: 400, isSuccess: false, data: [], message: 'SERVER_ERROR' };
        })
    }
    else return { status: 400, isSuccess: false, data: [], message:'DB_METHODS_MODULE.PRODUCT_LENGTH_IS_ZERO' }
}

const responseMethod = (status, isSuccess, message, data) => {
    return { status, isSuccess, data: data ? data : null, message };
}
// const findPopulate = async (schema, populate, filter) => {
//     if(select){
//     await schema.find().populate(populate).select
// }
const findOneAndDelete = async (schema, filter) => {
    return await schema.findOneAndDelete(filter).then(result => {
        return { status: 200, isSuccess: true, data: result ? result : {}, message: "" };
    }).catch(err => {
        return { status: 400, isSuccess: false, data: err, message: 'SERVER_ERROR' };
    });
}

/**
 * Populate a product
 * @param {Schema} schema - Mongo schema
 * @param {Object} filter - filters without populate conditions
 * @param {Array} populate - populate fields and conditions 
 * @param {Object} options - it include pageNo,limit, sortby 
 * @param {Boolean} pagination - By setting it true pagination will be applied 
 * @returns {Promise<SchemaRecord>}
 */

// --------------------------------------------------------------------------------------------
// Data format of populate 
// [{ lookUp: { from: 'vouchers', foreignField: '_id', localField: 'voucherId', as: 'voucher' }, 
// condition: { 'voucher.status': voucherStatuses.ACTIVE }, 
// options: { empty: true } }]
// ---------------------------------------------------------------------------------------------

const findOneAndPopulate = async (schema, filter, populate, pagination = false, options, select) => {
    const query = []
    // filter for main collection
    if (filter && Object.keys(filter).length) query.push({ $match: filter });
    // lookup parser parse all look with conditions according to it
    const lookUp = lookUpParse(populate);
    // embed lookups to main query
    if (lookUp && lookUp.length)
        lookUp.map(item => {
            query.push(item)
        })
    if (select) {
        query.push({ $project: select })
    }
    // pagination
    if (pagination) {

        if (!options && !Object.keys(options).length) { options = { page: 1, limit: 10, sortBy: { createdAt: -1 } } }
        (!options.pageNo) && (options["page"] = 1);
        !options.limit && (options["limit"] = 10);
        !options.sortBy && (options["sortBy"] = { 'createdAt': -1 });
        let skip = (options.pageNo - 1) * options.limit;
        query.push({
            $facet: {
                results: [{
                    $sort: {
                        sortBy: 1,
                    },
                },
                {
                    $skip: skip,
                },
                {
                    $limit: options.limit,
                }
                ],
                resultCount: [
                    {
                        $count: "count",
                    },
                ],

            }
        })
    }
    console.log(query)
    return schema.aggregate(query).then(result => {
        let response = {}
        if (result && pagination) {
            response = {
                results: result[0].results,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(result[0].resultCount[0].count / options.limit),
                totalResults: result[0].resultCount[0].count
            }
        } else response = result;
        return { status: 200, isSuccess: true, data: response && Object.keys(response).length ? response : null, message: "ok" };
    }).catch(err => {
        return { status: 400, isSuccess: false, data: err, message:'SERVER_ERROR' };
    })
    // }
}

/** 
* @param {Array} populate - populate fields and conditions 
* @returns {Promise<SchemaRecord>}
*/

// --------------------------------------------------------------------------------------------
// Data format of populate 
// [{ lookUp: { from: 'vouchers', foreignField: '_id', localField: 'voucherId', as: 'voucher' }, 
// condition: { 'voucher.status': voucherStatuses.ACTIVE }, 
// options: { empty: true } }]
// ---------------------------------------------------------------------------------------------

const lookUpParse = (populate) => {
    if (populate && populate.length) {
        let query = [];
        // loop through each lookUp
        populate.map(item => {
            if (item.lookUp) {
                query.push({ $lookup: item.lookUp });
                if (item.options) {
                    const path = item.lookUp.as ? item.lookUp.as : item.lookUp.localField
                    query.push({ $unwind: { path: '$' + path, preserveNullAndEmptyArrays: item.options.empty } });
                }

                if (item.condition)
                    query.push({ $match: item.condition })
            }
        })
        return query;
    }
}

const paginationParsing = async (schema, filter, page, limit) => {

}

const findAndPopulateAggregation = async (schema, filter, populate, select, multiple = false) => {
    return schema.aggregate([
        { $match: filter },
        populate.lookUp,

    ]).then(result => {
        // const data = result && result.length ? result[0] : null;
        if (multiple) return responseMethod(200, true, "", result && result.length ? result : null)
        else return responseMethod(200, true, "", result && result.length ? result[0] : null)

    }).catch(err => {
        return responseMethod(400, false, null, "")
    })
}

/**
 * Find by aggregation
 * @param {Schema} schema  --mongoose schema
 * @param {Object} filter  --query filter
 * @returns {Promise<Schema>} 
 */

const findByAggregation = async (schema, filter, project) => {

    const query = [{ $match: filter }];
    console.log(JSON.stringify(query));
    if (project) query.push({ $project: project })
    return schema.aggregate(query).then(result => {
        return responseMethod(200, true, "", result && result.length ? result : null)
    }).catch(err => {
        return responseMethod(400, false, null, err)
    })
}

/**
 * Delete multiple
 * @param {Schema} schema  --mongoose schema
 * @param {Object} filter  --query filter
 * @returns {Promise<Schema>}
 */
const deleteMany = async (schema, filter) => {
    return schema.deleteMany(filter).then(result => {
        return responseMethod(200, true,'DELETED_SUCCESSFULLY', result && result.length ? result : null)
    }).catch(err => {
        return responseMethod(400, false, null, err);
    })
}


/**
 * Pagination Parser
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Object} --e.g{ sort: { createdAt: -1 }, limit: 10, skip: 0, page: 1 }
 */
const paginationParser = (options) => {
    let optionQuery = { sort: { createdAt: -1 }, limit: 10, skip: 0, page: 1 }
    if (options) {
        let page = options.page ? parseInt(options.page) : 1;
        let limit = options.limit ? parseInt(options.limit) : 10;
        let skip = (page - 1) * limit;
        optionQuery.limit = limit;
        optionQuery.skip = skip;
        optionQuery.page = page;
        // option.sort = options.sortBy ? { options[sortBy]: -1 }
    }
    return optionQuery;
}

/**
 * Mongoose aggregation and pagination handling
 * @param {Schema} schema - Mongo Schema
 * @param {Object} searchQuery - search query of mongodb
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {Query} facetQuery - mongoose query that used in $facet
 * @returns {Promise<QueryResult>}
 */
const aggregationPagination = (schema, searchQuery, options, facetQuery) => {

    // Pagination parser
    const pagination = paginationParser(options);

    // mongoose query for search,filter,sort,limit,skip
    let query = [];
    if (searchQuery)
        query = [...query, ...searchQuery];
    query = [...query, ...[{
        '$facet': {
            'totalResults': [
                {
                    '$count': 'total'
                }
            ],
            'results': facetQuery
        }
    }, {
        '$unwind': {
            'path': '$totalResults'
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
            totalResult: "$totalResults.total",
            page: 1,
            totalPages: 1,
            limit: pagination.limit,
            results: '$results'

        }
    }

    ]]
    console.log(JSON.stringify(query));
    // response of query
    return schema.aggregate(query).allowDiskUse(true).then(result => {
        return responseMethod(200, true, "ok", result && result.length ? result[0] : [])
    }).catch(err => {
        return responseMethod(400, false, err, null)
    })

}


/**
 * Search Query
 * @param {Object} index  --indexName, propertyName
 * @param {String} val  --value of search
 * @returns {Object<Query>}
 */
const searchQuery = (index, val) => {
    return {
        // $text: {
        '$search': {
            'index': index.indexName,
            'text': {
                'query': val,
                'path': index.propertyName,
                "fuzzy": {
                    "maxEdits": 2
                }
            },

        }
    }
    // }

}

/**
 * Query for Products
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {Object} filterSearch - mongoose search query
 * @returns {Promise<QueryResult>}
 */
const atlasSearchQueryParser = (filter, options, filterSearch, project, lookUp, additionalquery) => {

    //  validation for search
    let query = [];
    if (filterSearch)
        query.push(filterSearch)

    // validation for filter
    if (filter && Object.keys(filter).length > 0)
        query.push({ $match: filter })

    if (additionalquery) query.push(...additionalquery);
    // validation for options
    const pagination = paginationParser(options);
    let facetFilter = [{ $sort: pagination.sort }, { $skip: pagination.skip }, { $limit: pagination.limit }];
    if (lookUp) facetFilter.push(lookUp);
    if (project) facetFilter.push({ $project: project });
    return { query, options, facetFilter };

}
const dataPagination = (result, options) => {
    const data = result[0].results || [];
    const totalResults = result[0].totalResults[0]?.value || 0;
    const totalPages = Math.ceil(totalResults / options.limit);
    return { results: data, page: options.page, limit: options.limit, totalPages, totalResults }
  }
module.exports = {
    createNew,
    find,
    deleteById,
    updateById,
    findById,
    getBySlug,
    findOne,
    createMany,
    responseMethod,
    findOneAndDelete,
    updateOne,
    updateOneByFilter,
    updateMany,
    findOneAndPopulate,
    findAndPopulateAggregation,
    findByAggregation,
    paginationParser,
    aggregationPagination,
    searchQuery,
    atlasSearchQueryParser,
    deleteMany,
    dataPagination
    // updateManyById
}