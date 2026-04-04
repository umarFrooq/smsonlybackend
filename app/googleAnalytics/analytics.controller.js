
const analyticsService = require('./analytics.service');
const catchAsync = require("../../utils/catchAsync");
const pick = require('@/utils/pick');
let googleAnalytics = catchAsync(async (req, res) => {
    let result = await analyticsService.googleAnalytics(req.body);
    res.sendStatus(result)
}
)
let topKeyWords = catchAsync(async (req, res) => {
    let result = await analyticsService.getTopKeywords(req.query);
    res.sendStatus(result)
}
)
let googleEventNames = catchAsync(async (req, res) => {
    const filter = pick(req.query, ["to", "from"])
    let result = await analyticsService.googleEventNames(filter);
    res.sendStatus(result)
})
let googleAnalyticsV2 = catchAsync(async (req, res) => {
    let result = await analyticsService.googleAnalyticsV2(req.body);
    res.sendStatus(result)
}
)
let googleDimension = catchAsync(async (req, res) => {
    let result = await analyticsService.googleDimension(req.body);
    res.sendStatus(result)
}
)
let getGoogleAnalytics=catchAsync(async(req,res)=>{
    let result=await analyticsService.getGoogleAnalytics(req.query);
    res.sendStatus(result)
}
)
module.exports = {
    googleAnalytics,
    topKeyWords,
    googleEventNames,
    googleAnalyticsV2,
    googleDimension,
    getGoogleAnalytics,
}
