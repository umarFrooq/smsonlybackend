const { utils } = require("./leopards.utils");
const leopardEnums = require("./leopards.enums");
const ApiError = require("../../../utils/ApiError");
const { addressLocalTypes,logisticsCache } = require("@/config/enums");
const config = require("@/config/config");
const httpStatus = require("http-status");
const leopardCities = require("./leopards.city.json");
const { setCache, getCache } = require("../../../utils/cache/cache");
const fuzzySet = require("fuzzyset")
const en=require('../../../config/locales/en')
const getCities = async () => {
    let options = {};
    options.url = "http://new.leopardscod.com/webservice/getAllCitiesTest/format/json/";
    options.method = "POST";
    let data = { ...leopardEnums.credentials };
    let result = await utils(data, options);
    // return result;
    // console.log(result);
    result && result.city_list && result.city_list.forEach(element => {
        element["cityId"] = cityIdGenerator(element.name);
    });
    return result;
}

const placeOrder = async (orderData, orderDetail,) => {
    let options = {};
    options.url = "http://new.leopardscod.com/webservice/bookPacket/format/json/";
    options.method = "POST";
    let payload = { ...leopardEnums.placeOrderPayload };

    try {
        // const { address, city,  brandName, costCenterCode } = seller.SellerDetail;
        const { seller, orderItems } = orderData;
        const { fullname, address, phone, city } = orderDetail.orderAddress;
        const { email } = orderDetail.customer;
        // await storeCostCode();
        if (!orderData) {
            throw new ApiError(httpStatus.NOT_FOUND, 'LEOPARDS_MODULE.ORDER_DATA_NOT_FOUND' );
        }
        if (!orderData.seller || !orderData.seller.sellerDetail) {
            throw new ApiError(httpStatus.NOT_FOUND, 'LEOPARDS_MODULE.SELLER_NOT_FOUND' );
        }
        if (!orderData.orderItems || !orderData.orderItems.length) {
            throw new ApiError(httpStatus.NOT_FOUND, 'LEOPARDS_MODULE.ORDER_ITEMS_NOT_FOUND');
        }
        if (!orderDetail || !orderDetail.orderAddress) {
            throw new ApiError(httpStatus.NOT_FOUND,'LEOPARDS_MODULE.ORDER_DETAIL_NOT_FOUND' );
        }

        let _payload = { ...leopardEnums.placeOrderPayload };
        let international = orderDetail.customer && orderDetail.customer.defaultAddress && orderDetail.customer.defaultAddress.localType == addressLocalTypes.INTERNATIONAL ? true : false;
        if (international) {

        }
        else {
            _payload["consignment_name_eng"] = fullname;
            _payload["consignment_address"] = address;
            _payload["consignment_phone"] = phone;
            _payload["consignment_email"] = email;
        }
        if (!seller.sellerDetail._doc.city) {
            throw new ApiError(httpStatus.NOT_FOUND,'LEOPARDS_MODULE.SELLER_CITY_NOT_FOUND' );
        }
        let originCity = await cityFinder(seller.sellerDetail._doc.city)
        let destinationCity = await cityFinder(city)
        if(!originCity){
            throw new ApiError(httpStatus.NOT_FOUND,  en.responseMessages.LEOPARDS_MODULE.TCS_SERVICE_UNAVAILABLE_IN_ORIGIN_CITY +`${seller.sellerDetail._doc.city}`);
        }
        if(!destinationCity){
            throw new ApiError(httpStatus.NOT_FOUND, en.responseMessages.LEOPARDS_MODULE.TCS_SERVICE_UNAVAILABLE_IN_DESTINATION_CITY +`${city}`);
        }
        _payload["origin_city"] = originCity ///////////////---------city
        if (!city) {
            throw new ApiError(httpStatus.NOT_FOUND, 'LEOPARDS_MODULE.CUSTOMER_CITY_NOT_FOUND' );
        }
        _payload["destination_city"] = destinationCity;   ///////////////---------city`
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
        _payload["shipment_name_eng"] = orderData.seller.sellerDetail.brandName;
        _payload["shipment_phone"] = orderData.seller.phone ? orderData.seller.phone : "",
            _payload["shipment_address"] = orderData.seller.sellerDetail.address;
        _payload["shipment_email"] = orderData.seller.email,

            _payload["booked_packet_no_piece"] = pieces;
        _payload["booked_packet_weight"] = orderData.subWeight >= 1 ? orderData.subWeight : Math.ceil(orderData.subWeight);
        _payload["booked_packet_collect_amount"] = orderData.payable;
        _payload["booked_packet_order_id"] = orderData.orderId;
        if (orderDetail.refCode) {
            if (remarks) {
                remarks += `,  Referal Code: ${orderDetail.refCode}`;
            } else {
                remarks += `Referal Code: ${orderDetail.refCode}`;
            }
        }
        _payload["special_instructions"] = remarks || " ";
        console.log(_payload);
        // var data = qs.stringify(_payload);
        var data = _payload;

        let result = await utils(data, options);
        return result;
    }
    catch (err) {
        console.log(err);
        throw new ApiError(httpStatus.BAD_REQUEST, err.message);
    }

}


const cityIdGenerator = (cityName) => cityName.split("(")[0].replace(/[^a-zA-Z]/g, "").toLowerCase();

// const cityFinder = (cityName) => {
//     let cityId = cityIdGenerator(cityName);
//     let city = leopardCities.city_list.find(item => item.cityId == cityId);
//     if (!city) {
//         throw new ApiError(httpStatus.NOT_FOUND, "city not found");
//     }
//     else return city.id;
// }

let cityFinder = async (city = "sibbi") => {
    let cache = await getCache(`${logisticsCache.keys.LEOPARDS}`, undefined);
    let cities;
    if (!cache) {
      cities = await getCities();
      if (cities && (cities.status == 1) && cities.city_list && cities.city_list.length) {
        cities = cities.city_list
        console.log(cities[0])
        setCache(`${logisticsCache.keys.LEOPARDS}`, undefined, cities, logisticsCache.ttl.WEEK);
      }
    } else {
      cities = cache;
    }
    let citySet = fuzzySet()
    cities.forEach(city => citySet.add(city.name))
    let _city = citySet.get(city)[0]
    if (_city[0] > 0.78) {
      _city = cities.find( city => city.name == _city[1])
      return _city.id
    } else  return false
  }
  

module.exports = {
    getCities,
    placeOrder
}