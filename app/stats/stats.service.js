const { pageType } = require('./stats.enums');
const { OrderStatus, Visit } = require("../../config/mongoose");
const mongoose = require('mongoose');
const ApiError = require("../../utils/ApiError");
const router = require('../auth/auth.routes');
const { Follow } = require('../../config/mongoose');
const { dateFilter } = require('@/config/components/general.methods');


const statMethod = async (params) => {
    console.log('params : ', params)
    const result = await new Visit(params).save();
    console.log(result);
}

const getVisitCount = async (params) => {
    const { pageId, type, from, to, single } = params;
    let query = {};
    let filter = [];
    if (from && single) {
        let fromDate = new Date(from);
        let to = new Date(from);
        to.setDate(to.getDate() + 1);
        filter.push({ 'createdAt': { '$gte': fromDate, '$lt': to } });
    }
    if (from && to && !single) {
        let fromDate = new Date(from);
        let toDate = new Date(to);
        filter.push({ 'createdAt': { '$gte': fromDate, '$lte': toDate } });
    }
    if (from && !to && !single) {
        let fromDate = new Date(from);
        let toDate = new Date();
        filter.push({ 'createdAt': { '$gte': fromDate, '$lte': toDate } });
    }

    if (pageId && !type) {
        filter.push({ 'pageId': pageId })
    }
    if (type && !pageId) {
        filter.push({ 'type': type })
    }

    if (filter.length > 0) {
        query["$and"] = filter;
    }

    const result = await Visit.countDocuments(query);
    return result;

}

// const getDocumentCount = async(query) =>{
//    const {seller, status, from, to, single} = query;
//    try{
//    let filter = [];
//    if(seller){
//     filter.push({ 'order.seller': mongoose.Types.ObjectId(seller) })
//    }
//    if(status){
//        filter.push({'name' : status});
//    }
//    if(from && single){
//        let fromDate = new Date(from);
//        let to = new Date(from);
//        to.setDate(to.getDate()+1);
//           filter.push({'createdAt' : { '$gte' : fromDate , '$lt' : to }});
//    }
//    if(from && to && !single){
//        let fromDate = new Date(from);
//        let toDate = new Date(to);
//        filter.push({'createdAt' : { '$gte' : fromDate , '$lte' : toDate }});
//    }
//    if(from && !to && !single){
//        let fromDate = new Date(from);
//        let toDate =new Date();
//        filter.push({'createdAt' : { '$gte' : fromDate , '$lte' : toDate }});
//    }

// let mongooQuery =  [

//   ]
// mongooQuery.push(   {
//     "$lookup": {
//       "from": 'orders',
//       "localField": "order",
//       "foreignField": "_id",
//       "as": "order"
//     }
//   })
//   mongooQuery.push(  { "$unwind": "$order" })
// if(filter && filter.length>0)mongooQuery.push({ "$match": { "$and":filter } })
// mongooQuery.push(
//     {
//       "$group": {
//         "_id": "$_id",
//          "dateCreated": { "$first": "$createdAt" },
//          "name": { "$first": "$name" },
//       }
//     })
//     console.log(mongooQuery);
//     const count = await OrderStatus.aggregate(mongooQuery
//       )
//       return {length: count.length,
//               data: count 
//     };
//     }
//     catch(err){
//       throw err
//     }
// const {seller} = query;


const getDocumentCount = async (filter) => {
    // const {seller, status, from, to, single} = query;
    dateFilter(filter)
    Object.assign({ current: true }, filter);
    if (filter.seller)
        filter['seller'] = new mongoose.Types.ObjectId(filter.seller);
    const staistics = await OrderStatus.aggregate(
        [
            {
                '$match': filter
            }, {
                '$facet': {
                    'new': [
                        {
                            '$match': {
                                'name': 'new'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'shipped': [
                        {
                            '$match': {
                                'name': 'shipped'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'pending': [
                        {
                            '$match': {
                                'name': 'pending'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'cancel': [
                        {
                            '$match': {
                                'name': 'cancel'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'ready': [
                        {
                            '$match': {
                                'name': 'ready'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'confirmed': [
                        {
                            '$match': {
                                'name': 'confirmed'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'delivered': [
                        {
                            '$match': {
                                'name': 'delivered'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'completed': [
                        {
                            '$match': {
                                'name': 'completed'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'returned': [
                        {
                            '$match': {
                                'name': 'returned'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'refunded': [
                        {
                            '$match': {
                                'name': 'refunded'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'replacement': [
                        {
                            '$match': {
                                'name': 'replacement'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'received': [
                        {
                            '$match': {
                                'name': 'received'
                            }
                        }, {
                            '$count': 'count'
                        }
                    ],
                    'total': [
                        {
                            '$count': 'count'
                        }
                    ]
                }
            }
        ]
    ).read('secondary')
    let followCount = 0;
    if (filter.seller)
        followCount = await Follow.countDocuments({ followed: filter.seller }).read('secondary');
    const result = {
        pending: staistics[0].pending.length > 0 ? staistics[0].pending[0].count : 0,
        shipped: staistics[0].shipped.length > 0 ? staistics[0].shipped[0].count : 0,
        new: staistics[0].new.length > 0 ? staistics[0].new[0].count : 0,
        completed: staistics[0].completed.length > 0 ? staistics[0].completed[0].count : 0,
        confirmed: staistics[0].confirmed.length > 0 ? staistics[0].confirmed[0].count : 0,
        ready: staistics[0].ready.length > 0 ? staistics[0].ready[0].count : 0,
        cancel: staistics[0].cancel.length > 0 ? staistics[0].cancel[0].count : 0,
        delivered: staistics[0].delivered.length > 0 ? staistics[0].delivered[0].count : 0,
        returned: staistics[0].returned.length > 0 ? staistics[0].returned[0].count : 0,
        refunded: staistics[0].refunded.length > 0 ? staistics[0].refunded[0].count : 0,
        replacement: staistics[0].replacement.length > 0 ? staistics[0].replacement[0].count : 0,
        received: staistics[0].received.length > 0 ? staistics[0].received[0].count : 0,
        total: staistics[0].total.length > 0 ? staistics[0].total[0].count : 0,
        followers: followCount,
    }

    return result;

}

// ([
//     {
//         "$facet": {
//             "New": [{
//                 $match: { $and: [{ name: "pending" }, { order.seller: new mongoose.Types.ObjectId(seller) }] },
//             }, { $count: "Ordered" }],
//             "Shipped": [{
//                 $match: { $and: [{ name: "shipped" }, { order.seller: new mongoose.Types.ObjectId(seller) }] },
//             }, { $count: "Refunded" }],
//             "Pending": [{
//                 $match: { $and: [{ name: "pending" }, { order.seller: new mongoose.Types.ObjectId(seller) }] },
//             }, { $count: "Reviewed" }],
//             "Total": [{
//                 $match: { userId: new mongoose.Types.ObjectId(userId) }
//             },
//             { $count: "Total" }],
//         }
//     }

// ]
// ).


// console.log(count);


/**
 * @function
 * @description Returns the average order status age (in days) grouped by order status.
 * @param {Object} [filter] - Filter for selecting the order statuses. The filter can include a seller id, date range, or order status name.
 * @returns {Promise<Object>} - A promise that resolves to an object with the order status name as key and the average order status age as value.
 * @example
 * const filter = { seller: '5ffecb62695986bee472617c', from: '2021-01-01', to: '2021-01-31' };
 * const result = await averageStatusAge(filter);
 * console.log(result);
 * // Output: { "new": 1.5, "pending": 2.8, "shipped": 3.2, "delivered": 4.5 }
 */
const averageStatusAge = async (filter) => {
    dateFilter(filter)
    let match = filter;
    if (!filter || !Object.values(filter).length)
        match = { _id: { $ne: null } };
    if (filter.seller)
        filter['seller'] = new mongoose.Types.ObjectId(filter.seller);
    const result = await OrderStatus.aggregate([
        { $match: filter },
        {
            "$group": {
                "_id": "$name",
                "averageAge": { "$avg": "$statusAge" }
            }
        },
        {
            "$project": {
                "_id": 0,
                "status": "$_id",
                "averageAge": { "$round": ["$averageAge", 2] }
            }
        }
    ])
    const keyValuePairs = result.reduce((acc, curr) => {
        acc[curr.status] = curr.averageAge ? curr.averageAge : 0;
        return acc;
    }, {});
    return keyValuePairs;
}
module.exports = {
    statMethod,
    pageType,
    getVisitCount,
    getDocumentCount,
    averageStatusAge

}