const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const tableModel = require("./setting.model");
const {
  atlasSearchQueryParser, aggregationPagination, searchQuery
} = require("../../utils/generalDB.methods.js/DB.methods");
let { indexes, mtDefaultValue,regions } = require('../../config/enums')
const sortByParser = require("../../config/components/sortby.parser");
const { dataTypeParser, dateFilter } = require('../../config/components/general.methods')
const { getCache, setCache, deleteCasheByKey } = require('../../utils/cache/cache')
const { redisEnums } = require("../../config/enums");
// const {
//   responseMessages,
//   projectModules,
// } = require("../../utils/response.message");


/**
 * Create a  master table
 * @param {Object} tableBody
 * @returns {Promise<Table>}
 */
const createTable = async (body) => {
  try {
    if (!Object.keys(body).length)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Body is missing"
      );
    if (body.key) {
      body.key = body.key.toUpperCase();
      if (await tableModel.isExistKey({ key: body.key }))
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "key is already exist"
        );
    }
    if (body.label) body.label = body.label.toLowerCase();

    const result = await tableModel.create(body);
    if (result)
      setCache(`${redisEnums.KEYS.SETTING}-${result.key}`, undefined, result, redisEnums.TTL.SETTING)

    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Get Table by id
 * @param {ObjectId} id
 * @returns {Promise<Table>}
 */
const getTableById = async (tableId) => {
  try {
    if (!tableId)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        " Setting Id is required"
      );
    const result = await tableModel.findById(tableId);
    if (!result)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'No record found'
      );
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * update Table by id
 * @param {ObjectId} id
 * @param {Object} updatingBody
 * @returns {Promise<Table>}
 */
const updateTableById = async (updateBody, tableId) => {
  const {updateManyStores}=require('../sellerDetail/sellerDetail.service')
  try {
    if (!tableId)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        " Setting Id is required"
      );
    if (!Object.keys(updateBody).length)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Body is missing"
      );
    if (updateBody.key) {
      updateBody.key = updateBody.key.toUpperCase();
      if (await tableModel.isExistKey({ key: updateBody.key }))
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Key is already exist"
        );
    }
    if (updateBody.label) updateBody.label = updateBody.label.toLowerCase();
    const result = await tableModel.findByIdAndUpdate(tableId, updateBody, {
      new: true,
    });
    if(["SHIPPMENT-CHARGES","FOREX","VAT"].includes(result.key)&& updateBody.keyValue){
        updateManyStores({},{updatedAt:new Date()})
    }
    if("PREMIUM-AMOUNT"==result.key && updateBody.keyValue){
        updateManyStores({premium:false},{premiumPercentage:parseFloat(result.keyValue)})
    }
      if (result)
      setCache(`${redisEnums.KEYS.SETTING}-${result.key}`, undefined, result, redisEnums.TTL.SETTING)

    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};
/**
 * delete Table by id
 * @param {ObjectId} id
 * @returns {Promise<Table>}
 */
const deleteTableById = async (tableId) => {
  try {
    if (!tableId)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "setting Id is required"
      );
    const result = await tableModel.findByIdAndDelete(tableId);
    if (result)
      deleteCasheByKey(`${redisEnums.KEYS.SETTING}-${result.key}`)
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};
/**
 * filter Table
 * @param {params} [key,value,label,to,from,active and seach by label]
 * @returns {Promise<Table>}
 */
const filterTable = async (filter, options, search) => {
  // Sorting
  try {
    let additionalquery = [];
    options = sortByParser(options, { createdAt: -1 });
    filter = dateFilter(filter)

    // Projection of required fields
    const project = {
      id: "$_id",
      _id: 0,
      key: 1,
      keyValue: 1,
      label: 1,
      unit: 1,
      active: 1,
      description: 1,
    };
    // Get final agregation pipeline
    const query = userSearch(
      filter,
      options,
      search,
      project,
      undefined,
      additionalquery
    );
    // Execution of query
    if (query) {
      const result = await aggregationPagination(
        tableModel,
        query.query,
        query.options,
        query.facetFilter
      );
      if (result && result.isSuccess) return result.data;
      else throw new ApiError(result.status, result.message);
    }
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message)
  }
};
const userSearch = (filter, options, search, project, lookUp, additionalquery) => {
  let filterSearch;
  // search parsing for search
  if (search && search.name && search.value) {

    filterSearch = searchQuery({ indexName: indexes.setting.search.indexName, propertyName: indexes.setting.search.propertyName }, search.value);
  }
  // Query parsing for search
  return atlasSearchQueryParser(filter, options, filterSearch, project, lookUp, additionalquery);
}

const findOneMT = async (filter) => {
  const result = await tableModel.findOne(filter);
  return result
}

const settValueParser = async (filter) => {
  let val = null;
  if (filter) {
    val = filter.key;
  }
  let result = await findOneMT(filter)
  if (!result)
    result = mtDefaultValue[val];
  return result;
}

let handleSetting = async (filter) => {
  let setting = await getCache(`${redisEnums.KEYS.SETTING}-${filter.key}`);
  if (!setting || !Object.keys(setting).length || !setting.key)
    setting = await settValueParser(filter)
  if (!setting)
    throw new ApiError(httpStatus.BAD_REQUEST, `No setting record ${filter.key} found please create in the database`);
  setCache(`${redisEnums.KEYS.SETTING}-${setting.key}`, undefined, setting, redisEnums.TTL.SETTING)
  const settingValue = dataTypeParser(setting.dataType, setting.keyValue);
  return settingValue
}
const findSettings = async(filter)=>{
  return await tableModel.find(filter)
}
const getTaxes=async(user,data)=>{
  const{findSellerDetailById}=require('../sellerDetail/sellerDetail.service')
  let storeId=""
  if(user&&user.role=="supplier")
    storeId=user.sellerDetail._id
  if(user&&user.role=="admin")
  {
    if(!data.sellerId)
      throw new ApiError(httpStatus.BAD_REQUEST,"Seller id is required")
    storeId=data.sellerId
  }
  
  if(data.origin==regions.ALL)
     return []
  let filter=[]
if(data.origin==regions.PAK)
filter=["PAK_FOREX","PAK_VAT","PAK_SHIPPMENT","PAK_PREMIUM"]
if(data.origin==regions.KSA)
  filter=["KSA_SHIPMENT","KSA_FOREX","KSA_PREMIUM","KSA_VAT"]
if(data.origin==regions.CHINA)
  filter=["CHINA_PREMIUM","CHINA_FOREX","CHINA_VAT","CHINA_SHIPMENT"]
let [settings,store] = await Promise.all([
  findSettings({ key: filter }),
  findSellerDetailById(storeId)
]);
if(store&&store.premium&&store.premiumPercentage)
  if(settings&&settings.length)
settings.forEach(setting => {
  if (["KSA_PREMIUM", "PAK_PREMIUM"].includes(setting.key)) {
      setting.keyValue = store.premiumPercentage;
  }
});

return settings
 
}
const priceParser = async()=>{
  let settings= await findSettings({key:{$in:["PAK_FOREX","PAK_VAT","PAK_SHIPPMENT","PAK_PREMIUM","CHINA_PREMIUM","CHINA_FOREX","CHINA_VAT","CHINA_SHIPMENT","KSA_SHIPMENT","KSA_FOREX","KSA_PREMIUM","KSA_VAT"]}});
  // let basePrices={"PREMIUM-AMOUNT":0,"SHIPPMENT-CHARGES":0,"FOREX":0,"VAT":0};
  let basePrices = {
    PAK_FOREX: 0,
    PAK_VAT: 0,
    PAK_SHIPPMENT: 0,
    PAK_PREMIUM: 0,
    CHINA_PREMIUM: 0,
    CHINA_FOREX: 0,
    CHINA_VAT: 0,
    CHINA_SHIPMENT: 0,
    KSA_SHIPMENT: 0,
    KSA_FOREX: 0,
    KSA_PREMIUM: 0,
    KSA_VAT: 0
  };
  settings.forEach(val=>{
    basePrices[val.key]=dataTypeParser(val.dataType,val.keyValue);
  })
 console.log(basePrices)
 basePrices={pakPremium:basePrices["PAK_PREMIUM"],pakShipment:basePrices["PAK_SHIPPMENT"],pakForex:basePrices["PAK_FOREX"],pakVat:basePrices["PAK_VAT"],
  chinaPremium:basePrices["CHINA_PREMIUM"],chinaShipment:basePrices["CHINA_SHIPMENT"],chinaForex:basePrices["CHINA_FOREX"],chinaVat:basePrices["CHINA_VAT"]
  ,ksaPremium:basePrices["KSA_PREMIUM"],ksaShipment:basePrices["KSA_SHIPMENT"],ksaForex:basePrices["KSA_FOREX"],ksaVat:basePrices["KSA_VAT"]
};
console.log(basePrices)
 return basePrices;
}
let getShypDelareMul = async () => {
  let getShypDelareMul = {
    "SHYP_PAK_DEC_MUL": 0,
    "SHYP_KSA_DEC_MUL": 0,
    "SHYP_CHINA_DEC_MUL": 0,
  };
  const settings = await findSettings({ key: { $in:Object.keys(getShypDelareMul) } });
 
let dec={}
  // Parse and assign values to the respective keys
  settings.forEach(val => {
    if (val.key in getShypDelareMul) {
      getShypDelareMul[val.key] =parseFloat(val.keyValue)||0;
      console.log(parseFloat(val.keyValue))
    }
  });

  console.log("Parsed getShypDelareMul:", getShypDelareMul);

  // Assign parsed values to the required variables
  const result = {
    pakDeclareMul: getShypDelareMul["SHYP_PAK_DEC_MUL"],
    ksaDeclareMul: getShypDelareMul["SHYP_KSA_DEC_MUL"],
    chinaDeclareMul: getShypDelareMul["SHYP_CHINA_DEC_MUL"],
  };

  console.log("Final Result:", result);
  return result;
};
module.exports = {
  createTable,
  getTableById,
  updateTableById,
  deleteTableById,
  filterTable,
  findOneMT,
  settValueParser,
  handleSetting,
  findSettings,
  priceParser,
  getShypDelareMul,
  getTaxes
};
