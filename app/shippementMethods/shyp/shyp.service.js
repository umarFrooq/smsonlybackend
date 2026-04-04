const { shypUtil } = require("./shyp.utils");
const ApiError = require("../../../utils/ApiError");
const { addressLocalTypes,logisticsCache, shypEndpoints,addressArea,regions } = require("@/config/enums");
const config  = require("@/config/config");
const httpStatus = require("http-status");
const { setCache, getCache } = require("../../../utils/cache/cache");
const fuzzySet = require("fuzzyset")
const ShypCities = require("./shyp.model");
const { uploadBase64PDFToS3 } = require("@/config/upload-to-s3");
let {createOrderStatusAdmin}=require('../../orderStatus/orderStatus.service')
const {getShypDelareMul}=require('../../setting/setting.service')
const getCities = async (country) => {
  let options = {};
  options.url = "https://shyp.ai/City_Counntries";
  options.method = "POST";
  let data = {
    data_type: "3",
    country_code: country,
    state_id: "PB",
    statename: "Sindh",
  };
  let result = await shypUtil(data, options);
  // return result;
//   console.log(result);
  // result && result.city_list && result.city_list.forEach(element => {
  //     element["cityId"] = cityIdGenerator(element.name);
  // });
  return result;
};


const getCity = async (city) => {
    let options = {};
    options.url = "https://shyp.ai/City_Counntries";
    options.method = "POST";

    let data = {
     "data_type": "3",
     "country_code":"SA",
     "statename": "Punjab",
     "state_id": "SD",
     "city_name":city
    };

    let result = await shypUtil(data, options);
    // return result;
    console.log(result);
    // result && result.city_list && result.city_list.forEach(element => {
    //     element["cityId"] = cityIdGenerator(element.name);
    // });
    return result;
    
}

const placeOrder = async (orderData, orderDetail, user) => {
   let shypDeclareMultiplayer =await getShypDelareMul()
    let options = {};
    options.url = "https://shyp.ai/bookingAPI";
    options.method = "POST";

    try {
        const { seller, orderItems } = orderData;
        const { fullname, address, phone, city, country, area, zipCode } = orderDetail.orderAddress;
        const { email } = orderDetail.customer;
        if (!orderData) {
            throw new ApiError(httpStatus.NOT_FOUND, "order data not found");
        }
        if (!orderData.seller || !orderData.seller.sellerDetail) {
            throw new ApiError(httpStatus.NOT_FOUND, "seller not found");
        }
        if (!orderData.orderItems || !orderData.orderItems.length) {
            throw new ApiError(httpStatus.NOT_FOUND, "order Items not found");
        }
        if (!orderDetail || !orderDetail.orderAddress) {
            throw new ApiError(httpStatus.NOT_FOUND, "order Detail not found");
        }
        if (!seller.sellerDetail || !seller.sellerDetail._doc.brandName) {
            throw new ApiError(httpStatus.NOT_FOUND, "seller detail name not found");
        }
        if (!seller.sellerDetail._doc.zipCode || !seller.sellerDetail._doc.city || !seller.sellerDetail._doc.country) { 
            throw new ApiError(httpStatus.NOT_FOUND, "seller incomplete address");
        }



        let receiverCity = await destinationCityFounder(city);
        if (!receiverCity) { 
            throw new ApiError(httpStatus.NOT_FOUND, "cannot be shipped to the reciever city");
        }
        let senderCity={}
        if(["ksa","KSA","sa","SA"].includes(seller.sellerDetail._doc.country))
        {
            senderCity["cityCode"]=await destinationCityFounder(seller.sellerDetail._doc.city)
            senderCity["country"]=addressArea.countryCode.SAUDI_ARABIA
            senderCity["stateId"]=addressArea.countryCode.SAUDI_ARABIA


        }else{
         senderCity = await getSourceCities(seller.sellerDetail._doc.city);
        }
        if (!senderCity) { 
            throw new ApiError(httpStatus.NOT_FOUND, "cannot be shipped from the sender city");
        }


        let sender = {
            "sender_name": seller.sellerDetail._doc.brandName, /*Mandatory*/
            "sender_address1": splitAddress(seller.sellerDetail._doc.address)[0],  
            "sender_address2": splitAddress(seller.sellerDetail._doc.address)[1],
            "sender_city": senderCity.cityCode,//senderCity, /*Mandatory*/
            "sender_state": senderCity.stateId, /*Depends*/
            "sender_country": senderCity.country, /*Mandatory*/
            "sender_zip": seller.sellerDetail._doc.zipCode || "00000", /*Mandatory*/
            "sender_area": seller.sellerDetail._doc.area ? seller.sellerDetail._doc.area.split("-").pop().trim(" ").substring(0,23) : senderCity.city, /*Mandatory*/
            "sender_mobile": convertPhoneNumber(user.phone) , /*Mandatory*/
            "sender_id_type": "1", /*Mandatory in case of Parcel*/
            "sender_id_no": "0000000000000", /*Mandatory in case of Parcel*/
            "shp_ref": orderData.orderId
        }
        let receiver = {
            "receiver_name": fullname, /*Mandatory*/
            "receiver_address1": splitAddress(address)[0], //address, /*Mandatory*/
            "receiver_address2": splitAddress(address)[1], /*Optional*/
            "receiver_city": receiverCity, /*Mandatory*/
            "receiver_country": config.address.local, /*Mandatory*/
            "receiver_zip": zipCode || "00000", /*Depends*/
            "receiver_area": area ? area.split("-").pop().trim(" ").substring(0,23) : receiverCity, /*Mandatory*/
            "receiver_mobile": convertPhoneNumber(phone), /*Mandatory*/
            "receiver_email": email /*Optional*/
          }
  let orderInfo={}
  if(sender.sender_country==addressArea.countryCode.SAUDI_ARABIA)
  {
    orderInfo= orderInfoParser(orderData, orderDetail,addressArea.countryCode.SAUDI_ARABIA,shypDeclareMultiplayer);
    options.url='https://shyp.ai/bookingAPI_SA'
  }else
  {
    orderInfo= orderInfoParser(orderData, orderDetail,addressArea.countryCode.PAKISTAN,shypDeclareMultiplayer);
  }
  let shipmentObj = {
      "shipment_type": "1",/*Mandatory*/
      "shipment_purpose": "Commercial",/*Mandatory in case of Parcel*/
      "pieces_detail": orderInfo.pieces_detail,
      "content_detail": orderInfo.content_detail,
      "special_inst":  orderDetail.orderNote || ""
    }
        shipmentObj["sender"] = sender;
        shipmentObj["receiver"] = receiver;
        shipmentObj["special_inst"] = orderData.orderId

        let result = await shypUtil(shipmentObj, options);
        let label;
        if (result && result.laberl_feed) {
            label = await uploadBase64PDFToS3(result.laberl_feed, result.shipment_no)
        }
        result["label"] = label;
        return result;
    }
    catch (err) {
        // console.log(err);
        throw new ApiError(httpStatus.BAD_REQUEST, err.message);
    }

}

const orderInfoParser = (orderData, orderDetail,country=addressArea.countryCode.PAKISTAN,shypDeclareMultiplayer) => { 
    try {
        let pieces_detail = [];
        let content_detail = [];

        orderData.orderItems.forEach((item, index) => {
            let product = item.product;
            let piece = {
                "piece_id": index+1,
                "weight": product.weight || 1,
                "height": product.height || 1,
                "length": product.lenght || 1,
                "width": product.width || 1,
                "packiging": 'BOX'
            }
            pieces_detail.push(piece);
            if(regions.KSA==product.origin)
                product.price=product.price*shypDeclareMultiplayer.ksaDeclareMul
            if(regions.PAK==product.origin)
                product.price=product.price*shypDeclareMultiplayer.pakDeclareMul
            if(regions.CHINA==product.origin)
                product.price=product.price*shypDeclareMultiplayer.chinaDeclareMul
            let content = {
                "piece_id": index+1,
                "description": product.productName.replace(/[^a-zA-Z ]/g, "") , 
                "quantity": item.quantity,
                "value": valueConverter(product.price),
                "hs_code": index + 1,
                "man_country": country
            }
            content_detail.push(content);
        });
        return { pieces_detail, content_detail }
    }
    catch (err) {
        throw new ApiError(httpStatus.BAD_REQUEST, err.message);
    }
}


let destinationCityFounder = async (city) => {
    let country = config.address.local
    city = city.replace(/[^a-zA-Z]/g, "")
    let cache = await getCache(`${logisticsCache.keys.SHYP}`, undefined);
    let cities;
    // if (!cache) {
      cities = await getCities(country);
      if (cities && (cities.status == 'success')) {
          console.log(cities[0])
          cities = cities.data
        // setCache(`${logisticsCache.keys.SHYP}`, undefined, cities, logisticsCache.ttl.WEEK);
      }
    // } else {
    //   cities = cache;
    // }
    let citySet = fuzzySet()
    let cityMap = new Map()
    // cities.forEach(_city => citySet.add(_city.City_Name))
    for (let i = 0; i < cities.length; i++) { 
        let city = cities[i].city_name.replace(/[^a-zA-Z]/g, "")
        citySet.add(city)
        cityMap.set(city, cities[i])
    }
    let _city = citySet.get(city)[0]
    let finalCity
    if (_city[0] > 0.65) {
        console.log("found city", _city[1])
        finalCity =  cityMap.get(_city[1])   //await getCity(_city[1])
        console.log(finalCity)
      return finalCity.city_id
    } else  return false
}
  

const shypSourceCities = async () => { 
    let options = {};
    options.url = "https://shyp.ai/City_Counntries";
    options.method = "POST";
    let data = {
    "data_type": "5",
     "state_id": "PB"
    };
    let sourceStates = await shypUtil(data, options);
    if (sourceStates?.data && sourceStates?.data.length > 0) { 
        let states = sourceStates.data;
        for(let i=0; i<states.length; i++) { 
            let options = {};
            options.url = "https://shyp.ai/City_Counntries";
            options.method = "POST";
            let data = {
            "data_type": "6",
             "state_id": states[i].state_id
            };
            let result = await shypUtil(data, options);
            if(result?.data && result?.data.length > 0) {
                    let cityList = result.data;
                    for(let j=0; j<cityList.length; j++) { 
                        let city = cityList[j];
                        let cityObj = new ShypCities({
                            country: "PK",
                            city: city.city_name,
                            cityCode: city.city_code,
                            state: states[i].statename,
                            stateId: states[i].state_id,
                            type: "source"
                        });
                        cityObj.save();
                    }
            }
        }
    }
    console.log(sourceStates);
}


async function getSourceCities(city) {
    let cities = await ShypCities.find({ type: "source" }).lean();
    
    console.log(cities[0]);

    let citySet = fuzzySet()
    let cityMap = new Map()
    for (let i = 0; i < cities.length; i++) { 
        let city = cities[i].city.replace(/[^a-zA-Z]/g, "")
        citySet.add(city)
        cityMap.set(city, cities[i])
    }

    let _city = citySet.get(city)[0]
    let finalCity
    if (_city[0] > 0.65) {
        console.log("found city", _city[1])
        finalCity =  cityMap.get(_city[1])   //await getCity(_city[1])
        console.log(finalCity)
      return finalCity
    } else  return false
}

function splitAddress(input) {
    // Check if the input string is longer than 100 characters
    if (input.length > 80) {
        // Find the last space within the first 100 characters
        let splitIndex = input.lastIndexOf(' ', 80);

        // If no space is found, we’ll split at the 100th character anyway (to avoid an infinite loop)
        if (splitIndex === -1) splitIndex = 80;

        // Split the string into two parts
        const firstPart = input.substring(0, splitIndex).trim(); // First part up to the last space
        const secondPart = input.substring(splitIndex).trim(); // Remaining part after the split

        return [firstPart, secondPart];
    } else {
        // If the string is 100 characters or less, return it as the first part
        return [input, ''];
    }
}


function convertPhoneNumber(phoneNumber) {
    // Check if the phone number starts with +92
    if (phoneNumber.startsWith('+92')) {
        // Replace +92 with 0
        return '0' + phoneNumber.slice(3);
    }
    else if (phoneNumber.startsWith('+966')) {
        // Replace +92 with 0
        return '0' + phoneNumber.slice(4);
    }
    return phoneNumber; // Return the number as is if it doesn't start with +92
}

function valueConverter(value) {
    value = parseFloat(value)
    return (value/3.76).toFixed(2)
}

const orderTracking=async(trackId)=>{
    try{
    return await shypUtil({key:trackId}, {
        url:"https://shyp.ai/TrackingShpAPI",
        method:"POST"
      });
    }catch(error){
        throw new ApiError(httpStatus.BAD_REQUEST,error.message)
    }
}
const shypOrderStatusesCronJob = async () => {
    const{getShypOrderStatuses}=require('../../shippment/shippment.service')
    const { trackData, consignments } = await getShypOrderStatuses();
  
    if (trackData && consignments) {
      const result = await orderTracking(consignments);
  
      if (result?.status === "Success" && result.response.length > 0) {
        for (const trackedOrder of result.response) {
          const { ship_no, status: statusUpdates } = trackedOrder;
          const orderData = trackData.find(order => order.consignment_no === ship_no);
          if (!orderData) continue;
  
          let latestStatus = statusUpdates[statusUpdates.length - 1].status;
  
  
  
          let currentStatus =
            orderStatusMap[latestStatus] ||
            (latestStatus.startsWith("Delivered") ? orderStatuses.DELIVERED : orderStatuses.INPROCESS);
          if (currentStatus !== orderData.orderStatus || currentStatus == orderStatuses.INPROCESS) {
            let result = await createOrderStatusAdmin({ name: currentStatus, order: orderData.orderId, orderTrack: statusUpdates });
            console.log(`Updated order ${orderData.orderId} with status: ${latestStatus}`);
          }
        }
      }
    }
  };
  
module.exports = { getCities, placeOrder, shypSourceCities,orderTracking,shypOrderStatusesCronJob }
