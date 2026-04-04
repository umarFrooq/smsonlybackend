var express = require("express");

var authRoutes = require("./auth/auth.routes");
var userRoutes = require("./user/user.routes");
const studentRoutes = require("./student/student.routes");
var attendanceRoutes = require("./attendance/attendance.routes");
var branchRoutes = require("./branch/branch.routes");
var paperRoutes = require("./paper/paper.routes");
var schoolRoutes = require("./school/school.routes"); // Added school routes
const classScheduleRoutes = require("./class-schedule/class-schedule.routes"); // Added class schedule routes
const payrollRoutes = require("./payroll/payroll.routes");
const leavePolicyRoutes = require("./payroll/leavePolicy.routes");
const teacherAttendanceRoutes = require("./payroll/teacherAttendance.routes");
const certificateRoutes = require("./certificate/certificate.routes");
let addressRoutes=require('./address/address.routes')
// var bannerRoutes = require("./banner/banner.routes");
// var shippmentRoutes = require("./shippment/shippment.routes");
// var sellerDetailRoutes = require("./sellerDetail/sellerDetail.routes");
// var sellerConfidentialDetailRoutes = require("./sellerConfidentialDetail/sellerConfidentialDetail.routes");
var subjectRoutes = require("./subject/subject.routes");
// var marketRoutes = require("./market/market.routes");
// const docsRoute = require("./docs.route");
const router = express.Router();
const { version } = require('../package.json');
// const followRouter = require("./follow/follow.route");
// const firbaseRouter = require("./firebase/phoneAuth/route")
// const bannerSetRouter = require("./banner-set/banner-set.routes");
// const pushNotificationRoute = require("./firebase/push.notification/push.notification.route");
// const notificationRoute = require("./notifications/notification.route")
// // const friebaseRouter = require("./firebase/firebase.routes")
// const statsRouter = require("../app/stats/stats.routes");
// const reviewStatsRouter = require("../app/review.stats/review.stats.route");
// const groupBuyRoutes = require("../app/groupBy/group_buy.routes");
// const voucherRouter = require("../app/voucher/voucher.routes");
// const redeemRouter = require("../app/redeemVoucher/redeem.voucher.routes");
// const groupBuyTraceRouter = require("../app/groupBuyPriceTrace/groupBuyTrace.routes");
// const groupBuyCustomerTraceRouter = require("../app/groupBuyCustomerTrack/groupBuyCustomerTrack.routes");
const gradeRoutes = require("./grade/grade.routes");
const testRoutes = require("./test/test.routes");
const testResultRoutes = require("./testresult/testresult.routes");
const examRoutes = require("./exam/exam.routes");
const dateSheetRoutes = require("./datesheet/datesheet.routes");
const resultRoutes = require("./result/result.routes");
const assignmentRoutes = require("./assignment/assignment.routes"); // Added Assignment routes
const { mainSubmissionRouter, assignmentSpecificSubmissionRouter } = require("./assignment/submission.routes"); // Added Submission routes
// const logsRouter = require("./logs/logs.routes");
const config = require("../config/config");
const RequestIp = require('request-ip');
const complaintRoutes = require("./complaint/complaint.routes"); // Added Complaint routes
const feeRoutes = require("./fee/fee.routes"); // Added Fee routes
const simpleFeeRoutes = require('./fee/simpleFee.routes');
const subscriptionRoutes = require('./subscription/subscription.routes');
// const ipnRoutes = require('../app/alfaIPN/alfaIPN.routes');
// const report = require('../app/report/report.route')
// const analyticsRoutes = require('../app/analytics/analytics.routes');
// const googleAnalytics = require('../app/googleAnalytics/analytics.routes')
// const leopardRouter = require("./shippementMethods/leopards/leopards.routes");
// const dealsRouter = require("./deals/deals.routes");


const promotionalEmailRouter = require("./campaign/campaign.routes");
const userAnalyticsRoutes = require('./analytics/user.analytics.routes');

router.get("/health-check", (req, res) => {
  let response = { version: version }
  if (req.query.debugg == "8494456261") {
    const os = require("node:os");
    const ip = RequestIp.getClientIp(req);
    response["node_env"] = config.env;
    response["server_time"] = new Date();
    response['host'] = os.hostname();
    // client ip address
    response["ip"] = ip;
  }

  res.send(response);
});

// Sentry error check
router.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('Sentry error reporting is working!')
})

// router.use("/qa", qa);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use('/students', studentRoutes);
// router.use("/products", productRoutes);
// router.use("/categories", categoryRoutes);
// router.use("/banners", bannerRoutes);
// router.use("/cart", cartRoutes);
// router.use("/orderDetail", orderDetailRoutes);
// router.use("/order", orderRoutes);
// router.use("/sellerDetail", sellerDetailRoutes);
// router.use("/sellerConfidentialDetail", sellerConfidentialDetailRoutes);
// router.use("/wishList", wishListRoutes);
// router.use("/reviews", reviewRoutes);
router.use("/address", addressRoutes);
// router.use("/payment", paymentRoutes)
// router.use("/markets", marketRoutes)
// router.use("/orderStatus", orderStatusRoutes)
// // router.use("/docs", docsRoute);
// router.use("/shippmentDummy", blueRoute);
// router.use("/tcs", tcsRoute);
// router.use("/report", report)
// router.use("/google-analytics", googleAnalytics)
// router.use("/shippment", shippmentRoutes);
// router.use("/follow", followRouter);
// router.use("/firebase", firbaseRouter);
// router.use("/banner-set", bannerSetRouter);
// router.use("/push-notification", pushNotificationRoute);
// router.use("/notification", notificationRoute);
// // router.use("/firebase", friebaseRouter);
// router.use("/stats", statsRouter);
// router.use("/review-stats", reviewStatsRouter);
// router.use("/logs", logsRouter);
// router.use("/refund", refundRouter);
// router.use("/rrp", require("./rrp/rrp.routes"));
// router.use("/wallet", walletRoutes);
// router.use("/group-buy", groupBuyRoutes);
// router.use("/voucher", voucherRouter);
// router.use("/redeem", redeemRouter)
// router.use("/traceAbleGroupBuy", groupBuyTraceRouter)
// router.use("/trackCustomerLimit", groupBuyCustomerTraceRouter)
// router.use("/ipn", ipnRoutes);
// router.use("/leopards", leopardRouter);
// router.use("/sitemap", require("./sitemap/sitemap.routes"));
// router.use("/catalog", require("./catalog/catalog.routes"));
// router.use("/deals", dealsRouter);
// router.use("/wp", require("./mybazaarghar/mybazaar.routes"));
// router.use("/collection", require("./collection/collection.routes"));
// router.use("/lambda", require("./lambda/lambda.cronjob.routes"))
// router.use("/bulk-operation", require("./bulk.operations/bulk.operations.routes"));
// router.use("/social", require("./social.token/social.token.routes"));
// router.use("/analytics", analyticsRoutes);
// router.use("/translation", require("./translation/translation.routes.js"))
// router.use("/shyp", require("./shippementMethods/shyp/shyp.routes"))
// router.use("/rbac", require('./rbac/rbac.routes'))
// router.use("/setting", require("../app/setting/setting.routes"))
// router.use("/shop-china", require("./aliexpress/ae.routes.js"))
// router.use("/promotional-email", promotionalEmailRouter);
// router.use("/marketplace", require("./marketplace/marketplace.routes"));
// router.use("/checkout", require("../app/checkout/checkout.routes"))
// router.use("/shopify", require("./shopify/shopify.routes"));
// router.use("/rbac-access", require("./rbac-access/access.router"))
// router.use("/ae-feed", require("./aeFeed/aeFeed.routes"))
// router.use("/transactions", require("./transaction/transaction.routes"))

router.use("/branches", branchRoutes);
router.use("/subjects", subjectRoutes);
router.use("/grades", gradeRoutes);
router.use("/attendances", attendanceRoutes);
router.use("/tests", testRoutes);
router.use("/test-results", testResultRoutes);
router.use("/exams", examRoutes);
router.use("/datesheets", dateSheetRoutes);
router.use("/results", resultRoutes);
router.use("/papers", paperRoutes);
router.use("/schools", schoolRoutes); // Added school routes usage
// router.use("/student-records", studentRecordRoutes);
router.use("/class-schedules", classScheduleRoutes); // Added class schedule routes usage
// Syllabus routes
router.use('/syllabi', require('./syllabus/syllabus.routes'));
// router.use("/timetables", timetableRoutes); // Keep this commented if not used
router.use("/fees", feeRoutes); // Enabled Fee routes
// router.use("/fines", fineRoutes);

// Assignment and Submission Routes
router.use("/assignments", assignmentRoutes);
router.use("/assignments/:assignmentId/submissions", assignmentSpecificSubmissionRouter); // Mount for nested routes
router.use("/submissions", mainSubmissionRouter);

// Payroll Routes
router.use("/payrolls", payrollRoutes);
router.use("/leave-policies", leavePolicyRoutes);
router.use("/salary-slips", require("./payroll/salarySlip.routes"));

// Teacher Attendance Routes
router.use("/teacher-attendances", teacherAttendanceRoutes);

// Salary Routes
router.use("/salaries", require("./payroll/salary.routes"));

router.use("/certificates", certificateRoutes);
router.use('/user-analytics', userAnalyticsRoutes);

// Complaint and Report Routes
router.use("/complaints", complaintRoutes);
router.use('/simple-fees', simpleFeeRoutes);
router.use('/subscriptions', subscriptionRoutes);


module.exports = router;