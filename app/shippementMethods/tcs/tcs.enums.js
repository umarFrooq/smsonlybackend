const config = require("../../../config/config");

const placeOrderPayLoad = {
  userName: config.tcs.userName,
  password: config.tcs.password,
  services: "O",
  fragile: "No",
};

const createCostCenterCodePayload = {
  userName: config.tcs.userName,
  password: config.tcs.password,

  isLabelPrint: "Yes",
  accountNo: config.tcs.accountNo,
};

const cancelOrderPayload = {
  userName: config.tcs.userName,
  password: config.tcs.password,
  consignmentNumber: ""
}

const trackOrder = {
  consignmentNo: ""
}

module.exports = {
  placeOrderPayLoad,
  createCostCenterCodePayload,
  cancelOrderPayload,
  trackOrder
};
