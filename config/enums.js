const { streamingUrl, ginkgo, ksaPayment } = require("./config");

const productTypes = {
  MAIN: 'main',
  VARIANT: 'variant',

};
const orderDetailStatuses = {
  PENDING: 'pending',
  CANCEL: 'cancel',
  COMPLETE_DELIVERED: 'completeDelivered',
  PARTIAL_DELIVERED: 'partialDelivered',

};
const reportTypes = { 'QA': 'qa', 'REVIEW': 'review' };

const reportRefTypes = {
  PRODUCT: "product",
  REVIEW: "review"
}
const comment = {
  'INAPPROPRAITE': 'Inappropriate',
  'SCAM': 'Scam',
  'IRRELEVANT': 'Irrelevant',
}

const shippmentTypes = {
  LOCAL: 'local',
  INTERCITY: 'intercity',
};
const orderStatuses = {
  NEW: 'new',
  CONFIRMED: 'confirmed',
  READY: 'ready',
  CANCEL: 'cancel',
  DELIVERED: 'delivered',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  REPLACEMENT: 'replacement',
  RECEIVED: "received",
  RETURNED: "returned",
  INPROCESS: "inProcess"
};

const orderCanceledBy = {
  USER: 'user',
  SUPPLIER: 'supplier',
}



const addressTypes = {
  HOME: 'home',
  OFFICE: 'office',
  //INTERNATIONAL:"international"
}
const addressLocalTypes = {
  LOCAL: 'local',
  INTERNATIONAL: "international"
}
const categoryTypes = {
  MAIN_CATEGORY: 'main',
  SUB_CATEGORY: 'sub',

};

const categoryEnums = {
  KEYS: {
    ALL_CATEGORIES: 'all_categories',
    CATEGORIES: 'categories',
    CATEGORY_PRODUCTS: 'category_products',


  },
  TTL: { // Time in seconds to Expire
    FIVE_MIN: 300,
    TWELVE_MIN: 720,
    HOUR: 3600,
    DAY: 86400,
    WEEK: 604800,
    MONTH: 2592000,
    YEAR: 31536000,
  }
}

const marketTypes = {
  MAIN_MARKET: 'main',
  SUB_MARKET: 'sub',

};
const bannerTypes = {
  SALE_BANNER: 'sale',
  OTHER: 'other',

};
// const productAttributes =Object.freeze( {
//   COLOR: 'color',
//   SIZE: 'size',

// });
const productAttributes = { attributes: ['color', 'size', 'storage', 'ram'] };


const verificationMethods = {
  EMAIL: 'email',
  SMS: 'sms',
  FACEBOOK: 'facebook',
  GOOGLE: 'google',
  APPLE: 'apple',

};
//const verificationMethod = ['email', 'sms', 'facebook', 'google'];
const userTypes = {
  FACEBOOK: 'facebook',
  GOOGLE: 'google',
  LOCAL: 'local',
  PHONE_NUMBER: 'phoneNumber',
  APPLE: 'apple',
};
const paymentStatuses = {
  PENDING: 'pending',
  PAID: 'paid',

};
const paymentTypes = {
  CASH_ON_DILIVERY: 'cashOnDilivery',
  JAZZ_CASH: 'jazzCash',

};
//const paymentStatus = ["pending", "paid"];
const loginOptions = ["local", "google", "facebook"];
const roles = Object.freeze({
  user: "user",
  admin: "admin",
});
const loginMethods = Object.freeze({
  local: "local",
  facebook: "facebook",
  google: "google",
});
const redisEnums = {
  KEYS: {
    // ALL_CATEGORIES: 'all-categories',
    // CATEGORIES: 'categories',
    CATEGORIES: 'categories',
    PRODUCTS: 'products',
    EMAIL_CODE: "emailCode",
    SETTING: "setting",
    FORGET_PASSWORD: "forgetPassword",
    FORGET_PASSWORD_LAST_ATTEMPT: "forgetPasswordLastAttempt"
  },
  TTL: { // Time in seconds to Expire
    CATEGORIES: 3600,
    PRODUCTS: 3600,
    EMAIL_CODE: 600,
    SETTING: 604800,
    FORGET_PASSWORD: 900,
    FORGET_PASSWORD_LAST_ATTEMPT: 30
  }
}



const roleTypes = {
  SUPPLIER: "superadmin",
  STUDENT: "student",
  ADMIN: "admin",
  REQUESTED_SUPPLIER: "teacher",
  PLATFORM_ADMIN: "platformAdmin",
  ROOT_USER: "rootUser",
}

const bannerDevices = {
  MOBILE: "mobile",
  WEB: "web"
}

const paymentMethods = {
  COD: "cod",
  COD_WALLET: "cod_wallet",
  WALLET_CARD: "wallet_card",
  CARD: "card",
  WALLET: "wallet",
  MANUAL: "manual"
}

const refundStatuses = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  REFUNDED: "refunded",
  REPLACEMENT: "replacement",
  RECEIVED: "received",
  RETURNED: "returned"

}
const refundTypes = {
  PARTIAL: "partial",
  FULL: "full",
}
const appTypes = {
  CUSTOMER: "customer",
  SELLER: "seller"
}

const refundReasons = [
  "I have changed mind",

]
const replacementReasons = [
  // "I have changed mind",
  "I received a damaged product",
  "I received a wrong product",
  "Product quality is not as shown in product"
]

const voucherStatuses = {
  ACTIVE: "active",
  EXPIRED: "expired",
  SCHEDULED: "scheduled",
}

const transactionTypes = {
  DEBIT: "debit",
  CREDIT: "credit"
}
const shippmentMethod = {
  TCS: "tcs",
  LEOPARDS: "leopards",
  SHYP: "shyp",
  // BLUEX : "bluex"
}

const groupByDefaultDiscount = {
  discount: 10
}

const groupBuyEnum = {
  PENDING: 'pending',
  ACTIVE: 'active',
  FINISHED: 'finished',
  CANCELLED: 'cancel'
}

const categoryProdList = ["5fe1cbaac05d6b3eb844f6ed", "5fe1cbaac05d6b3eb844f6f0", "6038dd317e4d2a1f859d8255", "6040bbd745cb316c8ab8b024", "6040bbe845cb316c8ab8b026", "6040cdd8513d358144a14278", "6048c62a05ec9502c9f8cde3"]

const groupBuyUserLimit = 10;

const misc = { siteMapLimit: 30000 };

const newUserReward = { balance: 0 };

const originSource = {
  app: { customer: "customer-app", seller: "seller-app", customerIOS: "customer-ios", sellerIOS: "sellerIOS" },
  web: { customerWeb: "web-mobile", customerMobile: "web", sellerWeb: "seller-web", sellerMobile: "seller-mobile" }
}
const originSources = { ...originSource.web, ...originSource.app }
const catalogHeaders = [
  { id: 'id', title: 'id' },
  { id: 'title', title: 'title' },
  { id: 'price', title: 'price' },
  { id: 'mainImage', title: 'image_link' },
  { id: 'description', title: 'description' },
  { id: 'availability', title: 'availability' },
  { id: 'condition', title: 'condition' },
  { id: 'link', title: 'link' },
  { id: 'brand', title: 'brand' },
  // { id: 'googleProductCategory', title: 'google_product_category' },
  { id: 'salePrice', title: 'sale_price' },
  // { id: 'quantityToSellOnFacebook', title: 'quantity_to_sell_on_facebook' },
  // { id: 'salePriceEffectiveDate', title: 'sale_price_effective_date' },
  // { id: 'gender', title: 'gender' },
  // { id: 'color', title: 'color' },
  // { id: 'size', title: 'size' },
  // { id: 'shipping', title: 'shipping' },
  { id: 'weight', title: 'shipping_weight' },
  { id: "quantity", title: "quantity_to_sell_on_facebook" }
]
// const newUserReward = { balance: 0 };

// const originSource = {
//   app: { customer: "customer-app", seller: "seller-app" },
//   web: { customerWeb: "web-mobile", customerMobile: "web" }
// }

const currency = {
  Pakistan: "PKR",
  SaudiArabia: "SAR",
  China: "CNY",
}

const catalogCondition = {
  titleLength: 149
}

let tcsPdfOptions = { width: '1000', height: '1400' };

const productRandomRange = {
  max: 500,
  min: 1,
  limit: 20
}

const indexes = {
  product: {
    search: {
      indexName: "productsIndex",
      propertyName: "productName"
    },

  },
  sellerDetail: {
    search: {
      indexName: "storeSearch",
      propertyName: "brandName"
    }
  },
  users: {
    search: {
      indexName: "nameSearch",
      propertyName: "fullname"
    }
  },
  setting: {
    search: {
      indexName: "labelSearch",
      propertyName: "label"
    }
  }
}

const adminDiscountTypes = {
  PERCENTAGE: 'percentage',
  AMOUNT: 'amount'
}
const methods = {
  GET: 'get',
  POST: "post",
  DELETE: "delete",
  UPDATE: "update"
}
const wpEndPoints = {
  BATCH_PRODUCT: "products/batch",
  PRODUCT: "products",
}

const adminPlatformRoles = ["supplier", "admin", "requestedSeller"];

const reportActions = {
  PENDING: "pending",
  BLOCKED: "blocked",
  CANCELED: "canceled",
  NONE: "none"
}
const voucherTypes = {
  VOUCHER: "voucher",
  COUPON: "coupon"
}

const couponTypes = {
  PRODUCT: "product",
  ORDER: "order"

}

codeTypes = {
  RRP: "rrp",
  REF: "ref",
  COUPON: "coupon",
  VOUCHER: "voucher",
  CUSTOME_REF: "customRef"
}

const logisticsCache = {
  keys: {
    TCS: "tcs:cities",
    LEOPARDS: "leopards:cities",
    SHYP: "shyp:cities",
  },
  ttl: {
    HOUR: 3600,
    DAY: 86400,
    WEEK: 604800,
    MONTH: 2592000,
    YEAR: 31536000,
  }
}
const streamingEndpoints = {
  GET_ALL_RECORDED_VIDEOS: streamingUrl + "getrecordedvideo",
  GET_MONTHLY_ANALYTICS: streamingUrl + "analytics/monthwise",
  GET_OVERALL_ANALYTICS: streamingUrl + "analytics/overall",
  UPLOAD_VIDEO: streamingUrl + "vod/admin/save-upload-video",
  // GET_ALL_RECORDED_VIDEOS:  "getrecordedvideo"
}

const warrantyTypes = {
  NONE: "none",
  BRAND: "brand",
  SELLER: "seller"
}

const warrantyPeriods = {
  NONE: "none",
  DAY: "day",
  MONTH: "month",
  YEAR: "year",
  DAYS: "days",
  MONTHS: "months",
  YEARS: "years"
}

const volumeUnits = {
  NONE: "none",
  INCH: "inch",
  CM: "cm",
  M: "m",
  FT: "ft"
}
const sitemapTypes = {
  CATEGORY: "category",
  VIDEO: "video",
  STORE: "store",
  PRODUCT: "product"
}

const platforms = {
  ALIEXPRESS: "aliExpress",
  BAZAARGHAR: "bazaarGhar",
  GINKGO: "ginkgo",
  SHOPIFY: "shopify"
}

const aeUrls = {
  address: "aliexpress.ds.address.get",
  feeds: "aliexpress.ds.recommend.feed.get",
  feedName: "aliexpress.ds.feedname.get",
  // getProduct: "aliexpress.ds.product.get",
  getProduct: "aliexpress.ds.product.wholesale.get",
  getCategories: "aliexpress.ds.category.get",
  freightEstimate: "aliexpress.logistics.buyer.freight.get",
  placeOrder: "aliexpress.trade.buy.placeorder",
  orderAndPay: "aliexpress.ds.order.create",
  accessTokenUrl: "https://api-sg.aliexpress.com/rest",
  accessTokenApi: "/auth/token/create",
  refreshTokenApi: "/auth/token/refresh",
  auth: "https://api-sg.aliexpress.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=https://stage.bazaarghar.com&client_id=502022",
  order: "aliexpress.trade.order.create",
}

aeOrderProduct = {
  product_id: "",
  product_count: "",
  sku_attr: "none",
  order_memo: ""
}

const aeShippment = {
  pkAddress: {
    zip: "46000",
    country: "PK",
    address: "3rd Floor, 4th Rd, Chandni Chowk Block B Satellite Town",
    city: "Rawalpindi - Satellite Town",
    contact_person: "Ejaz Siddique",
    mobile_no: "3495423349",
    locale: "en_US",
    province: "Punjab",
    phone_country: "+92",
  },
  defaultShippmentMethod: "CAINIAO_FULFILLMENT_STD"
}

const aeShippingAddressPK = {
  zip: "46000",
  country: "PK",
  address: "3rd Floor, 4th Rd, Chandni Chowk Block B Satellite Town",
  city: "Rawalpindi - Satellite Town",
  contact_person: "Ejaz Siddique",
  mobile_no: "3495423349",
  locale: "en_US",
  province: "Punjab",
  phone_country: "+92",
}


const prodVideoTypes = {
  BG: "bg",
  YT: "yt",
  NONE: "none",
  CUSTOM: "custom",
  AE: "ae"
}
const dataTypes = {
  STRING: "string",
  NUMBER: "number",
  OBJECT: "object",
  ARRAY: "array"
}

const prodVideoAllowedTypes = {
  MP4: ".mp4",
  MOV: ".mov",
  YT: "youtube.com",
}
const mtDefaultValue = {
  PAKISTAN: {
    key: 'PAKISTAN',
    dataType: dataTypes.STRING,
    keyValue: 'PKR'
  },
  GROUP_DISCOUNT: {
    key: 'GROUP_DISCOUNT',
    dataType: dataTypes.NUMBER,
    keyValue: 10
  },
  LOCAL: {
    key: 'LOCAL',
    dataType: dataTypes.STRING,
    keyValue: 'local'
  },
  INTERCITY: {
    key: 'INTERCITY',
    dataType: dataTypes.STRING,
    keyValue: 'intercity'
  },
  BALANCE: {
    key: 'BALANCE',
    dataType: dataTypes.NUMBER,
    keyValue: 0
  },
  GROUP_BY_USER_LIMIT: {
    key: 'GROUP_BY_USER_LIMIT',
    dataType: dataTypes.NUMBER,
    keyValue: 10
  },
  LOCAL_CHARGES: {
    key: 'LOCAL_CHARGES',
    dataType: dataTypes.NUMBER,
    keyValue: ksaPayment.shippingCharges
  },
  INT_CHARGES: {
    key: 'INT_CHARGES',
    dataType: dataTypes.NUMBER,
    keyValue: 0
  },
  PAGE_CONFIG: {
    key: 'HP_WEB',
    dataType: dataTypes.OBJECT,
    keyValue: { hpWeb: "hpWeb" }
  }
}

const socialMedia = {

  FB: 'fb',

}
userStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
}
const settingCategory = {
  GENERAL: "general",
  CURRENCY: "currency",
  CHARGES: "charges",
  DISCOUNT: "discount",
  LIMITATION: "limits",
  SHIPMENT: "shippment",
  UNITS: "units",
  PAGE_CONFIG: "pageConfig",
  GOOLE_ANALYTICS: "googleAnalytics",
}

const emailType = {
  USER: "user",
  SUPPLIER: "supplier",
  USERS: "users",
  SELLERS: "sellers",
  ALL: "all"
}


const semanticSearch = {
  limit: 5,
  index: "vectorIndex",
  similarity: 0.67375
}
aeCost = {
  currencyFluctuation: 10,  // in percentage
  profit: 20, // in percentage
  shippmentFluctuation: 20,  // in percentage
}

const aliExpress = {
  country: "SA",
  currency: "SAR",
  language: "EN",
  sort: "priceAsc"
}
const environments = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
  DBAZAAR_PROD: "dbazaarProd"

}
const typesenseEnums = {
  SUGGESTION_RULE_NAME: "productQueries"
}
const queryTypes = {
  TEXT: "text",
  EXISTS: "exists",
  EQUALS: "equals",
  MUST_NOT: "mustNot",
  RANGE: 'range',
  IN: 'in'
}

const regions = {
  KSA: "ksa",
  PAK: "pak",
  CHINA: "china",
  ALL: "all"
}

const aliExpressCache = {
  KEYS: {
    ADDRESS: "aliexpress_address",
  },
  TTL: { // Time in seconds to Expire
    FIVE_MIN: 300,
    TWELVE_MIN: 720,
    HOUR: 3600,
    DAY: 86400,
    WEEK: 604800,
    MONTH: 2592000,
    YEAR: 31536000,
  }
}
const rbacCache = {
  keys: {
    RBAC: "rbac"
  },
  ttl: {
    HOUR: 3600,
    DAY: 86400,
    WEEK: 604800,
    MONTH: 2592000,
    YEAR: 31536000,
  }
}
const gateWay = {
  ALFALAH: "alfalah",
  CHECKOUT: "checkout"
}


const addressArea = {
  countryCode: {
    PAKISTAN: "PK",
    SAUDI_ARABIA: "SA",
    CHINA: "CN",
  },
  language: {
    ENGLISH: "en",
    ARABIC: "ar",
    CHINESE: "zh",
    URDU: "ur"
  }
}

const refund = {
  ORDER_DETAIL: "orderDetail",
  ORDER: "order",
  ORDER_ITEM: "orderItem"
}
const payment = {
  STATUS: "Paid"
}
const refundMethod = {
  WALLET: "wallet",
  CARD: "card"
}

const ginkgoEndpoints = {
  CREATE_ORDER: {
    url: `${ginkgo.baseUrl}/orderManagement/post_order_webhook`,
    method: "POST"
  }
}
const addOnTypes = {
  ADDON: "addOn",
  CANCELORDER: "cancelOrder",
  PLATFORM: "platform"
}
const googleSearch = {
  KEY_WORDS_LIMIT: 20
}

const ginkgoOrderStatuses = {
  Confirmed: 'confirmed',
  Fulfilled: 'ready',
  Cancelled: 'cancel',
  Delivered: 'delivered',
  Dispatched: 'shipped',
  Returned: "returned"
}

const platformOrders = [platforms.SHOPIFY]
const catLocation = {
  DEFAULT: "default",
  SLIDER: "slider",
  HOME: "home",
}

const shypEndpoints = {
  PLACE_ORDER: {
    url: "https://shyp.ai/bookingAPI",
    method: "POST"
  },
  ORDER_TRACKING: {
    url: "https://shyp.ai/TrackingShpAPI",
    method: "POST"
  }
}
const chatBotProductModel = {
  "featured": "Boolean",
  "onSale": "Boolean",
  "selectedAttributes": [{ "name": "String", "value": "String" }],
  "productName": "String",
  "price": "Number",
  "quantity": "Number",
  "regularPrice": "Number",
  "weight": "Number",
  "region": "String",
  "lang": "String"
}
const orderStatusMap = {
  "Shipment Information Received": orderStatuses.READY,
  "Arrived At Export Hub": orderStatuses.SHIPPED
};
const orderStatusDescription = {
  [orderStatuses.CONFIRMED]: "Order Confirmed",
  [orderStatuses.NEW]: "New order recieved",
  [orderStatuses.READY]: "Order is ready to shipment",
  [orderStatuses.COMPLETED]: "Order has been completed"
}

const transactionGeneratedFor = {
  CUSTOMER: "customer",
  SELLER: "seller",
  COMMISSSION: "commission"
}
const googleEvents = [
  "screen_view",
  "page_view",
  "user_engagement",
  "notification_receive",
  "session_start",
  "notification_dismiss",
  "first_visit",
  "scroll",
  "FeatureName",
  "add_to_wishlist",
  "add_to_cart",
  "app_remove",
  "form_start",
  "first_open",
  "Add_to_cart",
  "InitiateCheckout",
  "app_exception",
  "Add_shipment_info",
  "notification_foreground",
  "notification_open",
  "Purchase",
  "add_shipping_info",
  "app_clear_data",
  "click",
  "GroupBuy",
  "purchase",
  "view_search_results",
  "view_item",
  "Add_to_wishlist",
  "os_update",
  "Product_page_view",
  "form_submit",
  "app_update",
  "Search_page_view",
  "Add_shippment_info",
  "Add_payment_info"
]

const googleMetrics = [
  "active1DayUsers",
  "active28DayUsers",
  "active7DayUsers",
  "activeUsers",
  "addToCarts",
  "adUnitExposure",
  "advertiserAdClicks",
  "advertiserAdCost",
  "advertiserAdCostPerClick",
  "advertiserAdCostPerKeyEvent",
  "advertiserAdImpressions",
  "averagePurchaseRevenue",
  "averagePurchaseRevenuePerPayingUser",
  "averagePurchaseRevenuePerUser",
  "averageRevenuePerUser",
  "averageSessionDuration",
  "bounceRate",
  "cartToViewRate",
  "checkouts",
  "cohortActiveUsers",
  "cohortTotalUsers",
  "crashAffectedUsers",
  "crashFreeUsersRate",
  "dauPerMau",
  "dauPerWau",
  "ecommercePurchases",
  "engagedSessions",
  "engagementRate",
  "eventCount",
  "eventCountPerUser",
  "eventsPerSession",
  "eventValue",
  "firstTimePurchaserRate",
  "firstTimePurchasers",
  "firstTimePurchasersPerNewUser",
  "grossItemRevenue",
  "grossPurchaseRevenue",
  "itemDiscountAmount",
  "itemListClickEvents",
  "itemListClickThroughRate",
  "itemListViewEvents",
  "itemPromotionClickThroughRate",
  "itemRefundAmount",
  "itemRevenue",
  "itemsAddedToCart",
  "itemsCheckedOut",
  "itemsClickedInList",
  "itemsClickedInPromotion",
  "itemsPurchased",
  "itemsViewed",
  "itemsViewedInList",
  "itemsViewedInPromotion",
  "itemViewEvents",
  "keyEvents",
  "newUsers",
  "organicGoogleSearchAveragePosition",
  "organicGoogleSearchClicks",
  "organicGoogleSearchClickThroughRate",
  "organicGoogleSearchImpressions",
  "promotionClicks",
  "promotionViews",
  "publisherAdClicks",
  "publisherAdImpressions",
  "purchaseRevenue",
  "purchaserRate",
  "purchaseToViewRate",
  "refundAmount",
  "returnOnAdSpend",
  "screenPageViews",
  "screenPageViewsPerSession",
  "screenPageViewsPerUser",
  "scrolledUsers",
  "sessionKeyEventRate",
  "sessions",
  "sessionsPerUser",
  "shippingAmount",
  "taxAmount",
  "totalAdRevenue",
  "totalPurchasers",
  "totalRevenue",
  "totalUsers",
  "transactions",
  "transactionsPerPurchaser",
  "userEngagementDuration",
  "userKeyEventRate",
]

const braches={
MAIN:"main",
SUB:"sub"
}
module.exports = {
  productTypes,
  addressLocalTypes,
  addressTypes,
  categoryTypes,
  bannerTypes,
  productAttributes,
  paymentStatuses,
  paymentTypes,
  loginMethods,
  loginOptions,
  roles,
  categoryEnums,
  orderDetailStatuses,
  orderStatuses,
  verificationMethods,
  userTypes,
  shippmentTypes,
  addressLocalTypes,
  marketTypes,
  redisEnums,
  roleTypes,
  bannerDevices,
  paymentMethods,
  refundStatuses,
  refundTypes,
  appTypes,
  refundReasons,
  replacementReasons,
  voucherStatuses,
  transactionTypes,
  shippmentMethod,
  groupByDefaultDiscount,
  groupBuyUserLimit,
  groupBuyEnum,
  categoryProdList,
  misc,
  catalogHeaders,
  newUserReward,
  originSource,
  currency,
  catalogCondition,
  tcsPdfOptions,
  productRandomRange,
  indexes,
  adminDiscountTypes,
  wpEndPoints,
  methods,
  adminPlatformRoles,
  logisticsCache,
  reportTypes,
  comment,
  reportRefTypes,
  reportActions,
  voucherTypes,
  couponTypes,
  codeTypes,
  streamingEndpoints,
  warrantyTypes,
  warrantyPeriods,
  volumeUnits,
  sitemapTypes,
  userStatus,
  regions,
  queryTypes,
  rbacCache,
  googleSearch,
  prodVideoTypes,
  prodVideoAllowedTypes,
  socialMedia,
  mtDefaultValue,
  dataTypes,
  aeUrls,
  aeShippingAddressPK,
  aeOrderProduct,
  platforms,
  aliExpress,
  orderCanceledBy,
  emailType,
  settingCategory,
  semanticSearch,
  userStatus,
  environments,
  typesenseEnums,
  regions,
  queryTypes,
  aeUrls,
  aeShippingAddressPK,
  platforms,
  aeCost,
  aliExpress,
  aliExpressCache,
  gateWay,
  rbacCache,
  addressArea,
  gateWay,
  payment,
  refund,
  refundMethod,
  ginkgoEndpoints,
  addOnTypes,
  googleSearch,
  ginkgoOrderStatuses,
  catLocation,
  addOnTypes,
  shypEndpoints,
  originSources,
  platformOrders,
  chatBotProductModel,
  addOnTypes,
  catLocation,
  orderStatusMap,
  orderStatusDescription,
  transactionGeneratedFor,
  googleEvents,
  braches
};


