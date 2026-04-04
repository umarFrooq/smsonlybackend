// const roles = ['user', 'admin', 'supplier', 'requestedSeller', 'marketplace', 'student', 'teacher', 'staff', 'admin_education'];

// Canonical top platform role is now "platformAdmin".
const roles = ['student', 'teacher', 'admin', 'superadmin', 'platformAdmin'];

const roleRights = new Map();
roleRights.set(roles[0], [ // student
  "manageProfile", 'manageReview', 'manageCart', "viewPhone", "getGroupBuy",
  'manageWishList', 'manageAddress', "managePayment", "manageVideo", "follow", "shippmentStatus",
  "changePassword", "firebaseToken",  "manageWallet", "refund", "voucher", "pushNotification","cardPayment",
  "manageQuestion","validCode","manageStatus","manageOrderStatus", "CardInfo", "transaction","oderDetial",
  "subject", "viewAttendances", "viewOwnClassSchedule",
  "viewSyllabus",
  // Assignment related for student
  "getAssignments", "viewAssignmentsGrade", "submitAssignment", "viewOwnSubmissions",
  // Exam and Result
  "getExams", "getDateSheets", "getResults","viewClassSchedules",
  // Complaint related for student
  "viewComplaints", "manageComplaints","viewCertificates" // Students can view and create their own complaints
]);

roleRights.set(roles[1], [ // teacher
  'getUsers', 'manageUsers', "manageVisitStats","manageRoles","manageQa",
  'manageCategories', 'manageProducts', "viewPhone", "manageProfile", "manageMarket",
  "manageOrderDetails", "manageOrders", "manageAllOrders", "getOrders", "manageHomePage", "manageSellerConfidentialDetails",
  "manageSellerDetail", "manageOrderStatuses", "manageStats", "changePassword", "manageShippment", "createShippment", "manageVideo", "shippmentStatus", "manageBannerSet",
  "firebaseToken", 'manageReview', "manageOrderStatus", "manageData", "manageCart", 'userManageAddress', "manageAdminCart", "manageOrderDetail", "manageRefCode", "rrpManage",
  "manageFirebase", "manageWallet", "refund", "manageRefund", "manageVoucher", "manageGroupBuy", "manageLogs", "print", "manageSiteMap", "adminOrder", "manageAllProducts",
  "pushNotification","manageDeals",  "pushNotification", "getOrderTransaction", "updateSlug", "manageCollections","manageBulkOp","manageSeller","manageDashboard","manageGA","manageTranslation",
  "manageStore","manageReport","productImport","manageSetting","socialToken","managePromotion","manageVector","manageCurrency","manageToken","manageFeedSync","manageVideoUpload", "videoCount","manageRevenue","manageStatus",  "apiKey",
  "manageTransaction","attendanceManagement", "viewAttendances", "testManagement","testResultManagement","subject", "viewGrades","manageAttendances",
  "viewOwnClassSchedule", "getMyPayrolls", "getMySalarySlips",// Teacher can view their own schedule
  // Assignment related for teacher
  "manageAssignments", "getAssignments", "getPayrolls","manageOwnAssignments", "viewAssignmentSubmissions", "gradeSubmission",
  // Exam and Result
  "getExams", "manageExams", "getDateSheets", "manageDateSheets", "getResults", "manageResults",
  // Complaint related for teacher
  "viewComplaints", "manageComplaints","viewCertificates", "respondComplaints" // Teachers can view, create complaints and respond to complaints against them
  , "viewOwnSyllabus"
]);

roleRights.set(roles[2], [ // admin (School Admin)
  "reportgeneration", "manageProfile", 'manageProducts', 'manageAddress', "createShippment", "viewPhone", "manageStats",
  "manageOrders", "getOrders", "manageSellerDetail", "subjectManagement", "manageVideo", "manageSellerConfidentialDetail", "print", "notification",
  "firebaseToken", "changePassword", "csvUpload", "manageRefund", "refund", "userManageAddress",  "pushNotification","manageAnswer", "manageSeller", "manageDashboard", "manageTranslation", "manageStatus",
  "manageAnswer","manageCurrency","manageToken","manageFeedSync","videoCount","apiKey","manageShopify","premium","sellerSetting","getUsers",
  "manageGrades", "viewGrades", "attendanceManagement", "viewAttendances", "testManagement", "testResultManagement", "manageUser", "manageUsers", "subject", "viewBranches", "manageBranches", "manageTeacherAttendances", "getTeacherAttendances", "managePayrolls", "manageLeavePolicies", "manageSalaries", "getSalaries",
  "manageGrades", "viewGrades", "attendanceManagement", "viewAttendances", "testManagement", "testResultManagement", "manageUser", "manageUsers", "subject", "viewBranches", "manageBranches", "manageTeacherAttendances", "viewTeacherAttendances", "getTeacherAttendances", "managePayrolls", "manageLeavePolicies", "manageSalaries", "getSalaries",
  "getLeavePolicies",
  "manageClassSchedules", "viewClassSchedules", "manageCertificates","manageSchoolLogo",// School admin can manage and view all schedules in their school
  "manageSyllabus", "viewSyllabus",
  // Assignment related for admin
  "manageAssignments", "getAssignments","getAnalytics",
   "viewAllAssignmentsSchool", "viewAllSubmissionsSchool",
    "gradeSubmission","getPayrolls",
    // Exam and Result
    "getExams", "manageExams", "getDateSheets","viewCertificates", "manageDateSheets", "getResults", "manageResults",
    // Complaint related for admin
  "viewComplaints", "manageComplaints", "respondComplaints", "deleteComplaints", // Admins can view, manage, respond to and delete complaints
  "manageFees", "viewFees"
]);

roleRights.set(roles[3], [ // superadmin (Platform Admin - can manage multiple schools if system designed for it, or top-level school admin)
  // Profile & Basic School Details
  "manageProfile",
  "manageOwnSchoolDetails", // General config for their own school (if superadmin is tied to one school) or manages all schools
  // User Management within their school(s)
  "manageSchoolUsers", // Covers creating/updating/deleting teachers, students, staff within their school(s)
  "viewSchoolUsers",   // Covers listing users within their school(s)
  // Branch Management (within their school(s))
  "manageBranches",
  "viewBranches",
  // Academic Configuration
  "manageGrades", "viewGrades",
  "manageSubjects", "viewSubjects", "subjectManagement",
  // "manageTimetables", "viewTimetables", // Replaced by ClassSchedules
  "manageClassSchedules", "viewClassSchedules", "manageCertificates","manageSchoolLogo",// Superadmin can manage schedules
  "manageSyllabus", "viewSyllabus",
  // Academic Operations
  "manageAttendances", "viewAttendances", "manageTeacherAttendances", "viewTeacherAttendances", "managePayrolls", "manageLeavePolicies", "manageSalaries", "getSalaries",
  "getTeacherAttendances",
  "getLeavePolicies",
  "manageTests", "viewTests",
  "manageTestResults", "viewTestResults",
  "managePapers", "viewPapers", // For exam papers etc.
  // Financial Management
  "manageFees", "viewFees",
  "manageFines", "viewFines",
  "manageSchoolBilling",
  // Other specific permissions previously assigned
  'manageAddress', // If superadmin manages addresses related to school/users
  "changePassword",  "notification", "firebaseToken",
  "gradeManagement", // Covered by manageGrades
  "attendanceManagement", // Covered by manageAttendances
  "testManagement", // Covered by manageTests
  "testResultManagement" ,// Covered by manageTestResults
  "getUsers","subject","manageUser", "getPayrolls", "managePayrolls",
  // "manageUser", "getUsers", "manageUsers", // Replaced by manageSchoolUsers, viewSchoolUsers for clarity
  // Assignment related for superadmin (assuming school-level management)
  "manageAssignments", "getAssignments",
   "manageAllAssignmentsSchool", "viewAllSubmissionsSchool",
   "gradeSubmission","getAnalytics",
   // Exam and Result
   "getExams", "manageExams", "getDateSheets", "manageDateSheets", "getResults", "manageResults", "announceExam", "announceResult",
   // Complaint related for superadmin
   "viewComplaints", "manageComplaints","generateCertificate","viewCertificates", "manageCertificates","respondComplaints", "deleteComplaints" // Superadmins have full access to complaints
]);

roleRights.set(roles[4], [ // platformAdmin
  "manageSchools", // Full CRUD on school entities
  "manageAllUsers", // Typically a root user can manage any user
  "viewSystemAnalytics", // Example permission
  "manageSystemSettings","subject", // Example permission
  // Assignment related for platformAdmin
  "manageAssignments", "getAssignments", "viewAllSubmissionsRoot",
  "getAnalytics",
  // Complaint related for platformAdmin
  "viewComplaints", "manageComplaints", "respondComplaints", "deleteComplaints" // Platform admins have full access to all complaints
  , "viewSyllabus","subjectManagement","generateCertificate","viewCertificates","manageCertificates"
]);
module.exports = {
  roles,
  roleRights,
};
