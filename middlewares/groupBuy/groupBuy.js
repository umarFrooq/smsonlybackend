const groupBuyService = require("../../app/groupBy/group_buy.service")
const groupBuyTrace = require("../../app/groupBuyPriceTrace/groupBuyTrace.model");
const groupTrace = require('../../app/groupBuyPriceTrace/groupBuyTrace.service')
const { groupBuyEnum } = require('../../config/enums');
const orderService = require("../../app/order/order.service")
const orderStatus = require("../../app/orderStatus/orderStatus.service")
const productService = require("../../app/product/product.service")
const moment = require('moment')
const { orderStatuses } = require("../../config/enums");
const { findOne } = require("@/utils/generalDB.methods.js/DB.methods");
const mongoose = require('mongoose');
const { algoliaProductUpdateAndSave } = require("@/app/product/algolia.service");


const updateGroupBuy = async (req, res, next) => {
  try {
    if (req.params.slug || req.params.productId) {
      let product;
      if (req.params.slug)
        product = await productService.findOneProduct({ slug: req.params.slug });
      else if (req.params.productId)
        product = await productService.findOneProduct({ _id: req.params.productId });
      else next();
      if (product && product.data) {
        // const date = new Date();
        // const timeZone = date.getTimezoneOffset();
        // date.setMinutes(date.getMinutes() + timeZone);
        let _product = product.data;
        const date = new Date();
        // let dateTimeZone = date.getTimezoneOffset();
        // date.setMinutes(date.getMinutes() + dateTimeZone);
        // const deal = await groupBuyService.getGroupBuyAggregation({ status: groupBuyEnum.PENDING, startDate: { $lte: new Date() }, endDate: { $gt: new Date() }, productId: _product.id });
        const deal = await groupBuyService.getGroupBuyAggregation({
          status: groupBuyEnum.PENDING,
          startDate: { $lte: date },
          endDate: { $gt: date },
          productId: mongoose.Types.ObjectId(_product.id)
        },
          {
            lookUp: {
              '$lookup': {
                'from': 'groupbypricetraces',
                'localField': '_id',
                'foreignField': 'groupBuyId',
                'as': 'traces'
              }
            }
          }
        );
        if (deal && deal.data && deal.data.status && deal.data.status.length) {
          // const getGroupBuyTrace = await groupTrace.getGroupBuyTrace({ groupBuyId: deal.data._id });
          const update = await groupBuyService.updateGroupBuy({ _id: deal.data._id }, { status: groupBuyEnum.ACTIVE });

          if (update && update.data) {
            if (deal && deal.data)
              await productService.updateProducts(groupBuyEnum.ACTIVE, deal.data.traces, _product.id);
          }
          else next();
          console.log(update);
          next();

        } else if (!deal || !deal.data || !deal.data.status.length) {
          const dealActive = await groupBuyService.getGroupBuyAggregation({
            status: groupBuyEnum.ACTIVE, endDate: { $lte: date },
            productId: mongoose.Types.ObjectId(_product.id)
          },
            {
              lookUp: {
                '$lookup': {
                  'from': 'groupbypricetraces',
                  'localField': '_id',
                  'foreignField': 'groupBuyId',
                  'as': 'traces'
                }
              }
            });
          if (dealActive && dealActive.data) {
            await groupBuyService.updateGroupBuy({ _id: dealActive.data._id }, { status: groupBuyEnum.FINISHED });
            if (dealActive && dealActive.data)
              await productService.updateProducts(groupBuyEnum.FINISHED, dealActive.data.traces, _product.id);
            next();
          } else {
            req["product"] = product.data;
            next()
          }
        }
        else {
          req["product"] = product.data;
          next()
        }
        // }

      } else next();

    } else next();
  } catch (e) {
    console.log(e);
    next()
  }
}
const groupBuyChecking = async (req, res, next) => {
  await groupBuyFinished(req.params)
  await RevertPriceOFProduct()
  await checkPendingGroupProduct()

  next()
}



const checkPendingGroupProduct = async () => {
  let date = new Date()
  let result = await groupBuyService.querySellerGroupBuy({}, { status: 'pending', startDate: { $lte: date } }, {})


  if (result) {
    result.data.results.map(async groupBuy => {
      groupBuy.status = 'active'

      await groupBuyService.groupBuyUpdateMany({}, groupBuy)
    })
  }

}


const RevertPriceOFProduct = async () => {
  let result = await groupBuyService.querySellerGroupBuy({}, { status: { $in: [groupBuyEnum.PENDING, groupBuyEnum.FINISHED, groupBuyEnum.CANCELLED] } }, {})
  let completeProducts = result.data.results;
  if (completeProducts.length > 0) {
    for (let i = 0; i < completeProducts.length; i++) {
      if (completeProducts[i]) {
        let product = await productService.getProductById(completeProducts[i].productId);

        if (product.variants.length > 0) {
          for (let i = 0; i < product.variants.length; i++) {
            let result = product.variants[i];
            console.log("result---------------")
            console.log(result)
            let result1 = await findOne(groupBuyTrace, { variantId: result._id })
            if (Object.keys(result1.data).length >= 1) {
              await productService.updateProductById(result.id, product.user, { variantGroupBuy: false, salePrice: result1.data.salePrice, price: result1.data.price })
            }


          }

        } else {
          let result1 = await findOne(groupBuyTrace, { productId: result._id })
          if (Object.keys(result1.data).length >= 1) {
            await productService.updateProductById(result.id, product.user, { variantGroupBuy: false, salePrice: result1.data.salePrice, price: result1.data.price })
          }
        }
      }
    }
  }



}




const groupBuyFinished = async (params) => {
  let product
  let result
  let order
  try {
    product = await productService.getBySlug(params)
    if (product) {
      result = await groupBuyService.getGroupBuyProduct({ productId: product._id, endDate: { $lte: new Date() }, status: "active" })



      if (Object.keys(result.data).length > 0) {
        let groupBuy = result.data
        groupBuy._doc.status = groupBuyEnum.FINISHED
        order = await orderService.getOrderBySeller(groupBuy.sellerId, true)
        if (order) {
          let orderId = order._id ? order._id : ''
          await orderStatus.createOrderStatus(order.seller, { order: orderId, name: orderStatuses.CANCEL })
        }
        //changes
        await groupBuyService.updateGroupBuyById(groupBuy._doc._id, groupBuy.sellerId, groupBuy._doc)

      } else {
        let result = await groupBuyService.getGroupBuyProduct({ productId: product._id, endDate: { $gt: new Date() }, status: "active" })
        if (Object.keys(result.data).length > 0) {
          let groupBuy = result.data

          let remainingProduct = Math.abs(groupBuy.buyAbleProduct - groupBuy.maxSubscription)
          groupBuy._doc.remainingProduct = remainingProduct
          groupBuy._doc.updateMinSubscription = groupBuy.maxSubscription
          await groupBuyService.updateGroupBuyById(groupBuy._doc._id, groupBuy.sellerId, groupBuy._doc)

        }


      }
    }
  } catch (err) {
    console.log(err)
  }





}

const activeDealHandler = async (_product) => {
  const deals = await groupBuyService.findGroupBuy({ status: groupBuyEnum.PENDING, startData: { $lte: new Date() }, productId: _product.id });
  if (deals && deals.data && deal.data.length) {

  }
}

// const updateProducts = async (status, traces, mainProduct) => {
//   let product;
//   if (status == groupBuyEnum.ACTIVE) {
//     for (let i = 0; i < traces.length; i++) {
//       let trace = traces[i];
//       product = await productService.updateByProductId(trace.productId, { onSale: true, salePrice: trace.groupBuySalePrice, price: trace.groupBuySalePrice });
//       if (traces.productId == mainProduct)
//         await algoliaProductUpdateAndSave(true, product.data);
//     }
//   }
//   else if (status == groupBuyEnum.FINISHED || status == groupBuyEnum.CANCELLED) {
//     for (let i = 0; i < traces.length; i++) {
//       let trace = traces[i];
//       product = await productService.updateByProductId(trace.productId, { onSale: trace.onSale, salePrice: trace.salePrice, price: trace.price, regularPrice: trace.regularPrice });
//       if (traces.productId == mainProduct)
//         await algoliaProductUpdateAndSave(true, product.data);
//     }
//   }
//   return product;
// }

module.exports = updateGroupBuy;