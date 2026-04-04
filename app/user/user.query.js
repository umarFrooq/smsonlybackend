const ApiError = require('../../utils/ApiError');
const { aggregationPagination, paginationParser } = require('../../utils/generalDB.methods.js/DB.methods');
const mongoose = require('mongoose');
const db = require("../../config/mongoose");
const userModel = db.User;
const { roleTypes, queryTypes } = require("../../config/enums");
const {queryTypeParser,atlasQueryTypeValidation,filterResponse}=require('../../config/components/general.methods')

const usersearchQuery = async (filter, options, search) => {
    const pagination = paginationParser(options);
    const results = queryParser(filter, search)
    const compoundQuery = atlasQueryTypeValidation(results)
    let lookUp = handleLookup(filter)
    let serachQuery= {
        '$search': {
          'index': 'nameSearch',
          'compound': compoundQuery,
          'count': {
            'type': 'total'
          }
        }
      }
    // Build an explicit $match stage for exact field filters to ensure $search compound filter behaves as expected
    const matchStage = {};
    if (filter && filter.branchId) {
        try {
            matchStage.branchId = mongoose.Types.ObjectId(filter.branchId);
        } catch (e) {
            matchStage.branchId = filter.branchId;
        }
    }
    if (filter && filter.gradeId) {
        try {
            matchStage.gradeId = mongoose.Types.ObjectId(filter.gradeId);
        } catch (e) {
            matchStage.gradeId = filter.gradeId;
        }
    }
    if (filter && filter.schoolId) {
        try {
            matchStage.schoolId = mongoose.Types.ObjectId(filter.schoolId);
        } catch (e) {
            matchStage.schoolId = filter.schoolId;
        }
    }
    if (Object.keys(matchStage).length) {
        // Log the explicit match for debugging
        console.log('Applying explicit $match for user search:', JSON.stringify(matchStage));
    }
      if (!Object.keys(search).length && !search.name && !search.value) {
        serachQuery["$search"]['sort'] = options.sortBy;
      }
    const query = [
        serachQuery,
        // If we have explicit match filters (gradeId/branchId), apply them right after $search
        ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
        {
            '$skip': pagination.skip
        }, {
            '$limit': pagination.limit
        },
        {
            $addFields: {
                'meta': '$$SEARCH_META',
            }
        },
        // Branch lookup
        {
            $lookup: {
                from: 'branches',
                localField: 'branchId',
                foreignField: '_id',
                as: 'branchObj'
            }
        },
        {
            $unwind: {
                path: '$branchObj',
                preserveNullAndEmptyArrays: true
            }
        },
        { '$project': {
            id: "$_id",
            _id: 0,
            fullname: 1,
            email: 1,
            role: 1,
            phone: 1,
            verificationMethod: 1,
            origin: 1,
            monthlyFee: 1,
            status:1,
            registrationNumber: 1,
            meta:1,
            rollNumber:1,
            gradeId: 1,
            section: 1,
            fatherName: 1,
            motherName: 1,
            guardianName: 1,
            guardianRelation: 1,
            guardianPhone: 1,
            guardianCnic: 1,
            addressLine1: 1,
            addressLine2: 1,
            city: 1,
            state: 1,
            postalCode: 1,
            country: 1,
            branchId: {
                _id: "$branchObj._id",
                name: "$branchObj.name"
            },
            certificate: 1,
            schoolId: 1
        }}
    ];
    console.log(JSON.stringify(query))
    const aggResult = await userModel.aggregate(query)
    const response = filterResponse(aggResult, pagination, options)

    // If Atlas Search returned no results, fallback to a regular Mongo query
    if (!response || response.totalResult === 0) {
        const mongoMatch = {};
        // build mongoMatch from provided filter
        if (filter) {
            if (filter.schoolId) {
                try { mongoMatch.schoolId = mongoose.Types.ObjectId(filter.schoolId); } catch (e) { mongoMatch.schoolId = filter.schoolId; }
            }
            if (filter.branchId) {
                try { mongoMatch.branchId = mongoose.Types.ObjectId(filter.branchId); } catch (e) { mongoMatch.branchId = filter.branchId; }
            }
            if (filter.gradeId) {
                try { mongoMatch.gradeId = mongoose.Types.ObjectId(filter.gradeId); } catch (e) { mongoMatch.gradeId = filter.gradeId; }
            }
            if (filter.role) mongoMatch.role = filter.role;
            if (filter.status) mongoMatch.status = filter.status;
        }

        // apply text search fallback for `search` object
        if (search && search.name && search.value) {
            const path = filter && filter.lang ? `lang.${filter.lang}.fullname` : 'fullname';
            // use case-insensitive regex
            mongoMatch[path] = { $regex: search.value, $options: 'i' };
        }

        const total = await userModel.countDocuments(mongoMatch);
        const sortObj = { createdAt: -1 };
        const docs = await userModel.find(mongoMatch)
            .select('fullname email role phone verificationMethod origin monthlyFee status registrationNumber rollNumber branchId gradeId section fatherName motherName guardianName guardianRelation guardianPhone guardianCnic addressLine1 addressLine2 city state postalCode country certificate schoolId')
            .sort(sortObj)
            .skip(pagination.skip)
            .limit(pagination.limit)
            .lean();

        const fallbackResponse = {
            page: options.page || 1,
            totalPages: Math.ceil(total / pagination.limit) || 0,
            limit: options.limit || 10,
            totalResult: total,
            results: docs || []
        };
        return fallbackResponse;
    }

    return response;

}


const queryParser = (filter, search) => {
    const filterQuery = [{
        'exists': {
            'path': '_id'
        }
    }];
    const mustQuery = [];
    let shouldQuery = [];
    const mustNot = [];
    if (search && search.name && search.value) {
        let path = filter.lang ? `lang.${filter.lang}.fullname` : 'fullname'
        mustQuery.push(queryTypeParser(search.value, path))
    }
    for (key in filter) {

        if (key === 'city') {

            filterQuery.push(queryTypeParser(filter[key], key));
            continue;
        }
        if (key === 'role') {

            // role is a keyword-like field in the search index; use EQUALS for exact match
            filterQuery.push(queryTypeParser(filter[key], key, queryTypes.EQUALS));
            continue;
        }
        if (key === 'branchId' || key === 'gradeId') {
            try {
                const oid = mongoose.Types.ObjectId(filter[key]);
                filterQuery.push(queryTypeParser(oid, key, queryTypes.EQUALS));
            } catch (e) {
                // fall back to raw value if not a valid ObjectId
                filterQuery.push(queryTypeParser(filter[key], key, queryTypes.EQUALS));
            }
            continue;
        }
      if (key === 'schoolId') {
  const schoolObjectId = new mongoose.Types.ObjectId(filter[key]);
  filterQuery.push(queryTypeParser(schoolObjectId, key, queryTypes.EQUALS));
  continue;
}



        if (key === "createdAt") {
            let query = { path: key ,...filter[key] }
            filterQuery.push(queryTypeParser(query, key, queryTypes.RANGE));

            continue;
        }
    }

    return { filterQuery, mustQuery, mustNot, shouldQuery }
}







function extractKeyAndDate(queryObject) {
    // Extract the key ($lte or $gte)
    let condition = Object.keys(queryObject)[0];

    // Extract the date string
    const dateString = queryObject[condition];

    condition = condition.slice(1);
    return { condition, dateString };
}
let handleLookup = (filter) => {
    let userLookup = {}
    let userUnwind = {}
    if (filter && Object.keys(filter).length <= 0 || filter.role == roleTypes.USER || filter.role == undefined) {

        userLookup = {
            '$lookup': {
                'from': 'addresses',
                'localField': 'defaultAddress',
                'foreignField': '_id',
                'as': 'address'
            }
        }

        userUnwind = {
            '$unwind': {
                'path': '$address',
                'preserveNullAndEmptyArrays': true
            }
        }
    } else {
        userLookup = {
            '$lookup': {
                'from': 'sellerdetails',
                'localField': '_id',
                'foreignField': 'seller',
                'as': 'address'
            }
        }

        userUnwind = {
            '$unwind': {
                'path': '$address',
                'preserveNullAndEmptyArrays': true
            }
        }

    }
    return { userLookup, userUnwind }
}

module.exports = {
    usersearchQuery,
    queryParser
}