const ApiError = require('@/utils/ApiError');
const { aggregationPagination, paginationParser } = require('@/utils/generalDB.methods.js/DB.methods');
const mongoose = require('mongoose');
const db = require("../../config/mongoose");
const SellerDetail = db.SellerDetail;
const { queryTypes } = require('../../config/enums')
const { queryTypeParser, atlasQueryTypeValidation, filterResponse } = require('../../config/components/general.methods')

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
const sellerDetailQuery = (filter, options, filterSearch, project, lookUp) => {

  //  validation for search
  let query = [];
  if (filterSearch)
    query.push(filterSearch)

  // validation for filter
  if (filter && Object.keys(filter).length > 0)
    query.push({ $match: filter })

  // validation for options
  const pagination = paginationParser(options);
  let facetFilter = [{ $sort: pagination.sort }, { $skip: pagination.skip }, { $limit: pagination.limit }];
  if (lookUp) facetFilter.push(lookUp);
  if (project) facetFilter.push({ $project: project });
  return { query, options, facetFilter };
  // const product = await aggregationPagination(SellerDetail, query, options, facetFilter)
  // if (product.isSuccess)
  //   return product.data
  // else throw new ApiError(product.status, product.message);
}


const searchQuerysellerDetail = async (filter, options, search) => {
  const pagination = paginationParser(options);
  const results = queryParser(filter, search)
  const compoundQuery = atlasQueryTypeValidation(results)
  const query = [
    {
      '$search': {
        'index': 'storeSearch',
        'compound': compoundQuery,
        'sort': options.sortBy,
        'count': {
          'type': 'total'
        }
      }
    },
    {
      '$project': {
        'meta': '$$SEARCH_META',
        'id': '$_id',
        '_id': 0,
        'images': 1,
        'brandName': 1,
        'city': 1,
        'sku': 1,
        'category': 1,
        'user': 1,
        'description': 1,
        'lang': 1,
        'seller': 1,
        'market': 1,
        'address': 1,
        'province': 1,
        'area': 1,
        'slug': 1,
        'logo': 1,
        'createdAt': 1,
        'slug': 1,
        'slug': 1,

      }
    }, {
      '$skip': pagination.skip
    }, {
      '$limit': pagination.limit
    }, {
      '$lookup': {
        'from': 'markets',
        'localField': 'market',
        'foreignField': '_id',
        'as': 'marketObj'
      }
    }, {
      '$unwind': {
        'path': '$marketObj',
        'preserveNullAndEmptyArrays': true
      }
    }

  ]
  console.log(JSON.stringify(query))
  const result = await SellerDetail.aggregate(query)
  return filterResponse(result, pagination, options)
}

const queryParser = (filter, search) => {
  const filterQuery = [];
  const mustQuery = [];
  let shouldQuery = [];
  const mustNot = [];
  if (search && search.name && search.value) {
    let path = filter.lang ? `lang.${filter.lang}.brandName` : 'brandName'
    mustQuery.push(queryTypeParser(search.value, path))
  }
  for (key in filter) {

    if (key === 'city') {

      filterQuery.push(queryTypeParser(filter[key], key));
      continue;
    }
    if (key === 'approved') {

      filterQuery.push(queryTypeParser(filter[key], key, queryTypes.EQUALS));
      continue;
    }
    if (key == "seller" || key == "market") {

      filterQuery.push(queryTypeParser(mongoose.Types.ObjectId(filter[key]), key, queryTypes.EQUALS));
      continue;
    }
    if (key === 'country') {
      filterQuery.push(queryTypeParser(filter[key], key));
      continue;
    }
  }

  return { filterQuery, mustQuery, mustNot, shouldQuery }
}


module.exports = {
  sellerDetailQuery,
  searchQuerysellerDetail,
  queryParser
}