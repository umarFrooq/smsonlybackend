const httpStatus = require("http-status");
const Deals = require("./deals.model");
const productService = require("../product/product.service");
const mongoose = require("mongoose");
const dealPriceTraceService = require("../dealTraces/dealTrace.service");
const DealPriceTrace = require("../dealTraces/dealTraces.model");
const { groupBuyEnum } = require('../../config/enums');
const { croneAuth } = require("../../config/config").auth

const {
  responseMethod,
  findOne,
  updateOne,
  findById,
  deleteById,
  findAndPopulateAggregation,
  updateOneByFilter
} = require("@/utils/generalDB.methods.js/DB.methods");


const createSellerDeal = async (body, _user) => {
  let products = [];
  products = await productService.getProductByIds(body.products);
  console.log(products);

  if (products && products.length > 0) {
    products = products.map(product => (product.isActive = true) && product);
    body.products = products.map(product => product._id);
    let date = new Date();
    let dateTimeZone = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() + dateTimeZone);
    // Product is active or not

    let alreadyExist = await findOne(Deals, { $or: [{ status: "pending" }, { status: "active" }], products: { $in: body.products } })
    if (alreadyExist.data !== null) {
      return responseMethod(
        httpStatus.BAD_REQUEST,
        false,
        "Product already exist in active or pending deal"
      );
    }

    let alreadyNameExist = await findOne(Deals, { $or: [{ status: "pending" }, { status: "active" }], name: body.name })
    if (alreadyNameExist.data !== null) {
      return responseMethod(
        httpStatus.BAD_REQUEST,
        false,
        "Deal name already exist"
      );
    }

    // calculation of discount
    if (body.discountType == "percentage") {
      products = products.map(product => {
        product.dealSalePrice = Math.floor(product.regularPrice * (body.discount / 100))
        return product
      });
    }
    else if (body.discountType == "price") {
      products.map(product => product.dealSalePrice = body.discount);
    }

    // Start date and end date validation
    let startDate = new Date(body.startDate);
    let endDate = new Date(body.endDate);

    if (startDate.getTime() <= date.getTime()) {
      return responseMethod(httpStatus.BAD_REQUEST, false, "Start Date should be greater or equal than current date");
    }
    if (endDate.getTime() < startDate.getTime()) {
      return responseMethod(httpStatus.BAD_REQUEST, false, "End Date should be greater than Start Date");
    }

    // Data parsing of group buy
    body.startDate = startDate.toUTCString();
    body.endDate = endDate.toUTCString();

    let deal = new Deals(body);

    // Creation of product trace

    let trace = await dealPriceTraceService.createManyTraces(products, { dealId: deal._id, discount: body.discount, discountType: body.discountType });


    // Group buy creation
    console.log(trace);

    deal = await deal.save();
    return responseMethod(httpStatus.OK, true, "deal Created Successfully", deal);


  } else return responseMethod(httpStatus.BAD_REQUEST, false, "Product is not found.");

};

const updateSellerDeal = async (body, dealId) => {
  let product, products, _traceProducts, traceObject = {};
  let deal = await findById(Deals, dealId);
  if (!deal || !deal.data) {
    return responseMethod(
      httpStatus.BAD_REQUEST,
      false,
      "Deal is not found."
    );
  }
  deal = deal.data;
  // products = deal.products;

  // if (deal.status !== groupBuyEnum.PENDING ){
  //   return responseMethod(
  //     httpStatus.BAD_REQUEST,
  //     false,
  //     "Deal is not in pending state."
  //   );
  // }

  if (body.status && body.status == groupBuyEnum.CANCELLED && deal.status == groupBuyEnum.PENDING) {
    let updatedDeal = await updateOneByFilter(Deals, { _id: dealId }, { status: groupBuyEnum.CANCELLED });
    return responseMethod(httpStatus.OK, true, "deal Updated Successfully", updatedDeal.data);
  }


  if (body.products) {
    products = await productService.getProductByIds(body.products);
    if (!products || products.length === 0) {
      return responseMethod(
        httpStatus.BAD_REQUEST,
        false,
        "Product is not found."
      );
    }

    products = products.map(product => {
      if (product.active == true)
        return product
    });

  }



  if (body.name) {
    deal.name = body.name;
  }
  if (body.limit) {
    deal.limit = body.limit;
  }
  if (body.minOrderAmount) {
    deal.minOrderAmount = body.minOrderAmount;
  }
  if (body.discountType) {
    deal.discountType = body.discountType;
    traceObject["discountType"] = body.discountType;
  }
  if (body.discount) {
    deal.discount = body.discount;
    traceObject["discount"] = body.discount;
  }

  // calculation of discount
  if (products && products.length > 0) {

    if (deal.discountType == "percentage") {
      products = products.map(product => {
        product._doc["dealSalePrice"] = Math.floor(product.regularPrice * (deal.discount / 100))
        return product
      });
    }
    else if (deal.discountType == "price") {
      products = products.map(product => {
        product._doc["dealSalePrice"] = deal.discount
        return product
      })
    }
    deal.products = products.map(product => product._id);
    _traceProducts = products.map(product => {
      return {
        productId: product._id,
        salePrice: product._doc.salePrice || 0,
        regularPrice: product._doc.regularPrice,
        price: product._doc.price,
        onSale: product._doc.onSale,
        dealSalePrice: product._doc.dealSalePrice,
      }
    })

    traceObject["products"] = _traceProducts;

  }


  if (body.status == groupBuyEnum.CANCELLED && deal.status == groupBuyEnum.ACTIVE) {
    return responseMethod(
      httpStatus.BAD_REQUEST,
      false,
      "Status is Active"
    );
  }

  if (body.status == groupBuyEnum.ACTIVE && deal.status == groupBuyEnum.CANCELLED) {
    return responseMethod(
      httpStatus.BAD_REQUEST,
      false,
      "Status is already cancel"
    );
  }

  if (body.status == groupBuyEnum.CANCELLED && deal.status == groupBuyEnum.FINISHED) {
    return responseMethod(
      httpStatus.BAD_REQUEST,
      false,
      "status is already FINISHED"
    );
  }



  let trace = await updateOneByFilter(DealPriceTrace, { dealId: deal._id }, traceObject);
  let updatedDeal = await updateOneByFilter(Deals, { _id: dealId }, { ...deal });
  return responseMethod(httpStatus.OK, true, "deal Updated Successfully", updatedDeal.data);
};


const getDealById = async (id) => {
  let deal = await findById(Deals, id);
  if (!deal || !deal.data || Object.keys(deal.data).length === 0) {
    return responseMethod(
      httpStatus.BAD_REQUEST,
      false,
      "Deal is not found."
    );
  }
  else return deal;
};



const queryAdminDeal = async (options, search) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const skip = (page - 1) * limit;
  // let value = new RegExp(search.value, 'i');
  // console.log(value)
  let query = [
    {
      '$lookup': {
        'from': 'products',
        'localField': 'products',
        'foreignField': '_id',
        'as': 'products'
      }
    }
  ]
  if (search && search.name && search.value) {
    let value = new RegExp(search.value, 'i');
    query.push({
      '$match': {
        'name': {
          '$regex': value
        }
      },

    })
  }
  query.push(...[
    { $sort: { endDate: 1 } },
    {
      '$limit': limit
    }, {
      '$skip': skip
    }
  ])

  let result = await Deals.aggregate(query);

  const totalResults = result.length
  const totalPages = Math.ceil(totalResults / limit);
  return { status: 200, isSuccess: true, data: { result, totalResults, totalPages, limit, page } }


};


const deleteDeal = async (id) => {
  let result = await findById(Deals, id);
  if (!result || !result.data || !Object.keys(result.data).length) {
    return responseMethod(
      httpStatus.BAD_REQUEST,
      false,
      "Deal is not found."
    );
  }
  if (result.data.status == groupBuyEnum.PENDING || result.data.status == groupBuyEnum.FINISHED || result.data.status == groupBuyEnum.CANCELLED)
    return await deleteById(Deals, id);
  else
    return responseMethod(
      httpStatus.BAD_REQUEST,
      false,
      "Status is active"
    );
};


const updateDeal = async (filter, body) => {
  return await updateOne(Deals, filter, body);
}

const getDealByProductId = async (productId) => {
  _products=[];
  _products.push(mongoose.Types.ObjectId(productId));
  return await findOne(Deals, { status: "active", products: { $in: _products } });
}

// }
const getDealAggrigation = async (filter, lookUp, select, multiple) => {
  return await findAndPopulateAggregation(Deals, filter, lookUp, select, multiple);
}


const updateStatuses = async (auth) => {
  if (auth && auth == croneAuth) {

    // pending deals--------------------------------------
    const date = new Date();
    const deal = await getDealAggrigation({
      status: groupBuyEnum.PENDING,
      startDate: { $lte: date },
      endDate: { $gt: date },
    },
      {
        lookUp: {
          '$lookup': {
            from: "dealpricetraces",
            localField: "_id",
            foreignField: "dealId",
            as: "traces"
          }
        }
      },
      null,
      true
    );
    if (deal && deal.data && deal.data.length) {
      for (let i = 0; i < deal.data.length; i++) {
        let id = deal.data[i]._id;
        updateDeal({ _id: id }, { status: groupBuyEnum.ACTIVE });
        if (deal.data[i].traces && deal.data[i].traces[0] && deal.data[i].traces[0].products && deal.data[i].traces[0].products.length)
          productService.updateDealProducts(groupBuyEnum.ACTIVE, deal.data[i].traces[0], id);
      }
    }

    //------------------------------------------------------

    const dealActive = await getDealAggrigation({
      status: groupBuyEnum.ACTIVE, endDate: { $lte: date },
    },
      {
        lookUp: {
          '$lookup': {
            from: "dealpricetraces",
            localField: "_id",
            foreignField: "dealId",
            as: "traces"
          }
        }
      },
      null,
      true
    );
    if (dealActive && dealActive.data && dealActive.data.length) {
      for (let i = 0; i < dealActive.data.length; i++) {
        let id = dealActive.data[i]._id;
        updateDeal({ _id: id }, { status: groupBuyEnum.FINISHED });
        if (dealActive.data[i].traces && dealActive.data[i].traces[0] && dealActive.data[i].traces[0].products && dealActive.data[i].traces[0].products.length)
          productService.updateDealProducts(groupBuyEnum.FINISHED, dealActive.data[i].traces[0], id);
      }
    }
    return { isSuccess: true, status: 200, message: "updated successfully", data: null }

  }
  return { isSuccess: true, status: 400, message: "invalid auth", data: null }
}





module.exports = {
  createSellerDeal,
  updateSellerDeal,
  queryAdminDeal,
  deleteDeal,
  updateDeal,
  getDealAggrigation,
  updateStatuses,
  getDealById,
  getDealByProductId
};
