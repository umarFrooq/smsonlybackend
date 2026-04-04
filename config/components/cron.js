var cron = require('node-cron');
var cron_scheduled = require('node-schedule')
const { cronJob } = require('../../config/config');
const groupBuyService = require("../../app/groupBy/group_buy.service")
const groupBuyTrace = require("../../app/groupBuyPriceTrace/groupBuyTrace.model");
const groupTrace = require('../../app/groupBuyPriceTrace/groupBuyTrace.service')
const { groupBuyEnum } = require('../../app/groupBy/group_buy.enums')
const orderService = require("../../app/order/order.service")
const orderStatus = require("../../app/orderStatus/orderStatus.service")
const productService = require("../../app/product/product.service")
const moment = require('moment')
const { orderStatuses } = require("../../config/enums");
const { findOne } = require("@/utils/generalDB.methods.js/DB.methods");

cron.schedule(cronJob.SCHEDULE_TIME, () => {
  console.log("cronjob group buy")
  console.log('Check Revert Price Products');
  RevertPriceOFProduct();

  console.log('Check Pending Products');
  checkPendingGroupProduct();
  console.log('Check Finished Products');
  checkfinishedGroupProduct();


});





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
  if (result.data.results.length > 0) {
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


  //   let product= await productService.getProductById(result.productId);

  //  if(product.mainProduct && product.isVariable==true){
  //   let variantGroupBuy= await groupTrace.getGroupBuyTraceWithVariantProductId(product.id)

  //  }else{

  //  }

}



const checkfinishedGroupProduct = async () => {
  let product
  try {
    product = await productService.getBySlug(params)
    if (product) {
      result = await groupBuyService.getGroupBuyProduct({ productId: product._id, endDate: { $lte: new Date() }, status: "active" })
      let result

      let order
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

const groupBuyValidation = () => {

}

const updateFinishedSchedule = () => {

}

const updatePendingSchedule = () => {

}