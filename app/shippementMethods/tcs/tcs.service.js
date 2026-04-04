const { tcsUtil } = require("./tcs.utils");
const tcsEnums = require("./tcs.enums");
const db = require("../../../config/mongoose");
const cryptoRandomString = require("crypto-random-string");
const { update } = require("../../sellerDetail/sellerDetail.service");
const SellerDetail = db.SellerDetail;
const ApiError = require("../../../utils/ApiError");
const { addressLocalTypes, tcsPdfOptions } = require("@/config/enums");
const config = require("@/config/config");
const tcsConfig = config.tcs;
const { find } = require("@/utils/generalDB.methods.js/DB.methods");
const { Order, OrderStatus } = require("../../../config/mongoose");
const httpStatus = require("http-status");
const { createOrderStatusAdmin } = require("../../orderStatus/orderStatus.service");
const { orderStatuses, logisticsCache } = require("@/config/enums");
const fuzzySet = require("fuzzyset")
const { setCache, getCache, updateCache } = require("../../../utils/cache/cache");
const en=require('../../../config/locales/en')
let S3 = require("@/config/s3.file.system");
const { convertHtmlToPDF } = require("@/config/components/general.methods");
const tcsPendingEnums = [
  "Scheduled for delivery",
  "In Transit",
  "Courier out for delivery",
  "Arrived at TCS Facility",
  "Departed From Origin"
]

const getAllCities = async () => {
  let options = {
    method: "GET",
    url: "https://api.tcscourier.com/production/v1/cod/cities",
  };
  // await storeCostCode();

  let result = await tcsUtil({}, options);
  if (result) {
    return {
      status: 200,
      isSuccess: true,
      message: 'SUCCESS',
      data: result.allCities,
    };
  } else {
    return { status: 403, isSuccess: false, message: 'FORBIDDEN', data: null };
  }
};


const placeOrder = async (orderData, orderDetail, sellerDetailId, payload, ...rest) => {
  let options = {
    method: "POST",
    url: "https://api.tcscourier.com/production/v1/cod/create-order",
  };

  try {
    // const { address, city,  brandName, costCenterCode } = seller.SellerDetail;
    const { seller, orderItems } = orderData;
    const { fullname, address, phone, city } = orderDetail.orderAddress;
    const { email } = orderDetail.customer;
    // await storeCostCode();
    if (!orderData) {
      throw new ApiError(httpStatus.NOT_FOUND, 'TCS_MODULE.ORDER_DATA_NOT_FOUND');
    }
    if (!orderData.seller || !orderData.seller.sellerDetail) {
      throw new ApiError(httpStatus.NOT_FOUND, 'TCS_MODULE.SELLER_NOT_FOUND' );
    }
    if (!orderData.orderItems || !orderData.orderItems.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'TCS_MODULE.ORDER_ITEMS_NOT_FOUND' );
    }
    if (!orderDetail || !orderDetail.orderAddress) {
      throw new ApiError(httpStatus.NOT_FOUND, 'TCS_MODULE.ORDER_DETAIL_NOT_FOUND' );
    }

    if (!orderData.seller.sellerDetail.costCode) {
      await createCostCenterCode(orderData.seller.sellerDetail, seller.id);
    }

    let _payload = { ...tcsEnums.placeOrderPayLoad };
    let international = orderDetail.customer && orderDetail.customer.defaultAddress && orderDetail.customer.defaultAddress.localType == addressLocalTypes.INTERNATIONAL ? true : false;
    if (international) {

    }
    else {
      _payload["consigneeName"] = fullname;
      _payload["consigneeAddress"] = address;
      _payload["consigneeMobNo"] = phone;
      _payload["consigneeEmail"] = email;
    }
    _payload["costCenterCode"] = seller.sellerDetail._doc.costCenterCode;
    if (!seller.sellerDetail._doc.city) {
      throw new ApiError(httpStatus.NOT_FOUND, 'TCS_MODULE.SELLER_CITY_NOT_FOUND' );
    }
    let originCity = await cityFinder(seller.sellerDetail._doc.city);
    let destinationCity = await cityFinder(city);
    if(!originCity) throw new ApiError(httpStatus.NOT_FOUND, TCS_MODULE.TCS_SERVICE_UNAVAILABLE_IN_STORE +`${seller.sellerDetail._doc.city}`+en.responseMessages.TCS_MODULE.CITY );
    if(!destinationCity) throw new ApiError(httpStatus.NOT_FOUND,  en.responseMessages.TCS_MODULE.TCS_SERVICE_UNAVAILABLE_IN_CUSTOMER +` ${city}`+ en.responseMessages.TCS_MODULE.CITY );
    _payload["originCityName"] = originCity
    if (!city) {
      throw new ApiError(httpStatus.NOT_FOUND, 'TCS_MODULE.CUSTOMER_CITY_NOT_FOUND' );
    }
    _payload["destinationCityName"] = destinationCity
    let remarks = orderDetail.orderNote || "";
    let pieces = 0;
    let productDetail = '';
    if (orderItems) {
      for (let i = 0; i < orderItems.length; i++) {
        let item = orderItems[i];
        productDetail += i == 0 ? `[${item.product['productName']}]X${item.quantity}` : `,[${item.product['productName']}]X${item.quantity}`;
        pieces += item.quantity;
      }
    }
    _payload["productDetails"] = productDetail;
    _payload["pieces"] = pieces;
    _payload["weight"] = orderData.subWeight >= 0.5 ? orderData.subWeight : 0.5;
    _payload["codAmount"] = orderData.payable;
    _payload["insuranceValue"] = "1";
    _payload["customerReferenceNo"] = orderData.orderId;
    if (orderDetail.refCode) {
      if (remarks) {
        remarks += `,  Referal Code: ${orderDetail.refCode}`;
      } else {
        remarks += `Referal Code: ${orderDetail.refCode}`;
      }
    }
    _payload["remarks"] = remarks;
    console.log(_payload);
    let result = await tcsUtil(_payload, options);
    return result;
  }
  catch (err) {
    console.log(err);
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
}



const createCostCenterCode = async (sellerDetail) => {
  let options = {
    method: "POST",
    url: "https://api.tcscourier.com/production/v1/cod/createCostCenterCode",
  };
  let payload = { ...tcsEnums.createCostCenterCodePayload };
  payload["costCenterCityName"] = sellerDetail._doc.city.toUpperCase();
  payload["costCenterCode"] = sellerDetail._doc.costCenterCode;
  payload["costCenterName"] = sellerDetail._doc.brandName;
  payload["pickupAddress"] = sellerDetail._doc.address;
  payload["returnAddress"] = sellerDetail._doc.address;

  let result = await tcsUtil({ ...payload }, options);
  if (result.returnStatus.status == 'SUCCESS' ) {
    update(sellerDetail.id, { costCode: true });
  } else {
    throw new ApiError(400, 'TCS_MODULE.COST_CODE_NOT_CREATED' );
  }
};
const storeCostCode = async () => {
  let stores = await SellerDetail.find();

  stores.map((s) => {
    // if (!s.costCode) {
    s._doc["costCenterCode"] = cryptoRandomString({
      length: 8,
      type: "alphanumeric",
    });
    s._doc["costCode"] = true;
    s.save();
    // }
  });
  console.log(stores);
  // let result = await SellerDetail.save();
  // if (result) {
  //   return {
  //     status: 200,
  //     isSuccess: true,
  //     message: "success",
  //     data: result.allCities,
  //   };
  // } else {
  //   return { status: 403, isSuccess: false, message: "Forbidden", data: null };
  // }
};
const getSellerDetailById = async (id) => {
  return SellerDetail.findOne({ _id: id });
};

const cancelOrder = async (body) => {
  let consignment = body.consignment;
  let options = {
    method: "PUT",
    url: "https://api.tcscourier.com/production/v1/cod/cancel-order",
  };
  let payload = { ...tcsEnums.cancelOrderPayload };
  payload.consignmentNumber = consignment;
  let result = await tcsUtil(payload, options);
  return result;
}

const trackShippment = async (consignment_no) => {
  let options = {
    method: "GET",
    url: `https://api.tcscourier.com/production/track/v1/shipments/detail/?consignmentNo=${consignment_no}`,
  };

  let payload = { ...tcsEnums.trackOrder };
  payload.consignmentNo = consignment_no;
  let result = await tcsUtil({}, options);
  return result;
}

const costCodeGenerator = async () => {
  let stores = await find(SellerDetail, { $or: [{ costCode: { $exists: false } }, { costCode: false }] });
  for (let i = 0; i < stores.length; I++) {
    store = stores[i];
    if (store["costCenterCode"]) store["costCode"] = true;
    else {
      store["costCenterCode"] = cryptoRandomString({ length: 8, type: "alphanumeric" });
      store["costCode"] = true;
    }
    store.save();
  }

  return { status: 200, isSuccess: true, data: {}, message: 'TCS_MODULE.COST_CODE_ARE_UPDATED' };
}

const consignmentPrint = async (consignment_no, uploadToPdf = false) => {
  let options = {
    method: "GET",
    url: `https://envio.tcscourier.com/BookingReportPDF/GenerateLabels?consingmentNumber=${consignment_no}`,
  };
  let html = await tcsUtil({}, options);
  let result;
  //       uploading to pdf
  if (uploadToPdf) {
    let file = { content: html };
    let pdf;
    const pdfBuffer = await convertHtmlToPDF(html, tcsPdfOptions);

    if (pdfBuffer) {
      let s3 = new S3(`${Date.now()}_label.pdf`, null, pdfBuffer);
      let uploaded = await s3.uploadToS3();
      if (uploaded.status == 200 && uploaded.data) {
        result = uploaded;
      }
    }
    // await html_to_pdf.generatePdf(file, pdfOptions).then(async (pdfBuffer) => {
    //   if (pdfBuffer) {
    //     let s3 = new S3(`${Date.now()}_label.pdf`, null, pdfBuffer);
    //     let uploaded = await s3.uploadToS3();
    //     if (uploaded.status == 200 && uploaded.data) {
    //       result = uploaded;
    //     }
    //   }
    // });
  }
  //----------------------------------//
  else {
    result = html;
  }
  return result;
}

const trackOrders = async () => {
  console.log("tcs cron job")
  let options = {};
  options.method = "GET";
  let url = "https://api.tcscourier.com/production/track/v1/shipments/detail?consignmentNo=";
  orders = await Order.aggregate([
    {
      $lookup: {
        from: "orderstatuses",
        localField: "orderStatus",
        foreignField: "_id",
        as: "orderStatus",
      },
    },
    {
      $unwind: {
        path: "$orderStatus",
      },
    },
    {
      $lookup: {
        from: "shippments",
        localField: "shippment",
        foreignField: "_id",
        as: "shippment",
      },
    },
    {
      $unwind: {
        path: "$shippment",
      },
    },
    {
      $match: {
        $or: [
          {
            "orderStatus.name": "ready",
          },
          {
            "orderStatus.name": "shipped",
          },
        ],
        "shippment.shippmentMethod": "tcs",
      },
    },
  ]);

  // console.log(orders);
  let consignment_nos = [];
  let consignments = orders.map((o) => {
    consignment_nos.push(o.shippment.consignment_no);
    return {
      orderId: o._id.toString(),
      consignment_no: o.shippment.consignment_no,
      orderStatus: o.orderStatus.name,
    };
  });
  // consignments.push("779401441850");
  // consignments.push("779401441863");
  if (consignments.length) {
    url += consignment_nos.join(",");
  } else return void 0;
  console.log(consignments);
  options.url = url;
  let result = await tcsUtil({}, options);
  if (
    result &&
    result.returnStatus.status == "SUCCESS"  &&
    result.TrackDetailReply &&
    result.TrackDetailReply.TrackInfo &&
    result.TrackDetailReply.TrackInfo.length
  ) {
    let trackInfo = result.TrackDetailReply.TrackInfo;
    for (let i = 0; i < trackInfo.length; i++) {
      let consignment_no = trackInfo[i].consignmentNo;
      let name = result.TrackDetailReply.DeliveryInfo.find(
        (obj) => obj.consignmentNo === consignment_no
      ).status;
      let order = consignments.find(
        (obj) => obj.consignment_no === consignment_no
      ).orderId;
      let oldStatus = consignments.find(
        (obj) => obj.consignment_no === consignment_no
      ).orderStatus;
      if (name == "DELIVERED") {
        if (oldStatus != orderStatuses.DELIVERED)
          await createOrderStatusAdmin({
            order,
            name: orderStatuses.DELIVERED,
          });
      } else if (tcsPendingEnums.includes(name)) {
        if (oldStatus != orderStatuses.SHIPPED)

          await createOrderStatusAdmin({ order, name: orderStatuses.SHIPPED });
      }

      console.log(name);
    }
  }

  return result;
};


let cityFinder = async (city = "sibbi") => {
  let cache = await getCache(`${logisticsCache.keys.TCS}`, undefined);
  let cities;
  if (!cache) {
    cities = await getAllCities();
    if (cities && cities.data && cities.data.length) {
      cities = cities.data
      setCache(`${logisticsCache.keys.TCS}`, undefined, cities, logisticsCache.ttl.WEEK);
    }
  } else {
    cities = cache;
  }
  let citySet = fuzzySet()
  cities.forEach(city => citySet.add(city.cityName))
  let _city = citySet.get(city)[0]
  if (_city[0] > 0.78) {
    return _city[1]
  } else return false
}

// cron.schedule(tcsConfig.scheduleTime, trackOrders);


module.exports = {
  getAllCities,
  placeOrder,
  storeCostCode,
  cancelOrder,
  trackShippment,
  costCodeGenerator,
  consignmentPrint,
  trackOrders,
  cityFinder
};
