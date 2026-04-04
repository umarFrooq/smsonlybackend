const { streamingEndpoints } = require("@/config/enums");
const { streamingUtils } = require("./streaming.utils");

const getAllVideos = async (filter = "", options = "") => {
  try {
    const reqOptions = {
      method: "GET",
      url: streamingEndpoints.GET_ALL_RECORDED_VIDEOS + filter + options
    }

    return await streamingUtils({}, reqOptions);
  } catch (err) {
    console.log(err)
    return { isSuccess: false, data: null, message: err.message, statu: 400 }
  }
}
const videoUpload = async (data) => {
  try {
    const reqOptions = {
        method: "POST",
        url: streamingEndpoints.UPLOAD_VIDEO,
       }
       return await streamingUtils(data, reqOptions);
    }
  
catch(err){
  console.log(err)
  return { isSuccess: false, data: null, message: err.message, statu: 400 }
}


}



module.exports = {
  getAllVideos,
  videoUpload
}
