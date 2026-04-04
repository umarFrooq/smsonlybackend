const router = require("express").Router();
const lambdaAuth = require("@/middlewares/lambda.auth");
const lambdaController = require("./lambda.cronjob.controller");

router.get("/voucher", lambdaAuth, lambdaController.voucherJob)
router.get("/products/translate", lambdaAuth, lambdaController.translateProducts)
router
    .route('/sync-all-feeds')
    .get(lambdaAuth, lambdaController.syncAllFeeds)

router
    .route('/sync-all-translation')
    .get(lambdaAuth, lambdaController.syncAllTranslation)
router
    .route('/sync-variants')
    .get(lambdaAuth, lambdaController.syncVariants)
router.route("/shopify/update-products")
    .get(lambdaAuth, lambdaController.updateShopifyProductsCron)

router
    .route('/update-order-statuses')
    .get(lambdaAuth,lambdaController.shypOrderStatusesCronJob)
    router
    .route('/update-order-delivered-to-completed')
    .get(lambdaAuth,lambdaController.updateDeliveredOrdersToCompleted)
module.exports = router; 
