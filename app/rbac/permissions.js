const permissions = {
    address: [
        {
            name: 'manageAddress',
            label: 'Manage Address',
            description: 'Allows the user to manage and update address details'
        },
        {
            name: 'userManageAddress',
            label: 'User Manage Address',
            description: 'Allows the user to manage their own address information'
        }
    ],
    alfalPN: [
        {
            name: 'cardPayment',
            label: 'Card Payment',
            description: 'Grants access to process card payments'
        }
    ],
    aliexpress: [
        {
            name: 'manageToken',
            label: 'Manage AliExpress Token',
            description: 'Allows managing the API tokens for AliExpress integration'
        },
        {
            name: 'manageFeedSync',
            label: 'Manage Feed Sync',
            description: 'Enables synchronization of product feed with AliExpress'
        },
        {
            name: 'productImport',
            label: 'Product Import',
            description: 'Allows importing products from AliExpress to the platform'
        },
        {
            name: 'managePice',
            label: 'Manage Price',
            description: 'Allows managing and updating prices of imported products'
        },
    ],
    analytics: [
        {
            name: 'manageDashboard',
            label: 'Manage Dashboard',
            description: 'Grants access to view and manage the analytics dashboard'
        },
        {
            name: 'manageRevenue',
            label: 'Manage Revenue',
            description: 'Allows the user to manage and track revenue analytics'
        }
    ],
    banner: [
        {
            name: 'manageHomePage',
            label: 'Manage Home Page Banner',
            description: 'Grants access to manage banners displayed on the home page'
        }
    ],
    bannerSet: [
        {
            name: 'manageBannerSet',
            label: 'Manage Banner Set',
            description: 'Allows managing sets of banners across various pages'
        }
    ],
    bulkOperations: [
        {
            name: 'manageBulkOp',
            label: 'Manage Bulk Operations',
            description: 'Allows the user to perform bulk operations such as bulk import/export'
        }
    ],
    campaign: [
        {
            name: 'managePromotion',
            label: 'Manage Promotion',
            description: 'Allows the user to manage and create promotions'
        }
    ],
    cart: [
        {
            name: 'manageCart',
            label: 'Manage Cart',
            description: 'Allows the user to manage and update cart details'
        },
        {
            name: 'manageAdminCart',
            label: 'Manage Admin Cart',
            description: 'Allows the user to manage and update cart details'
        }
    ],
    catalog: [
        {
            name: 'manageCatalogs',
            label: 'Manage Catalogs',
            description: 'Allows the user to manage catalogs'
        }
    ],
    category: [
        {
            name: 'manageCategories',
            label: 'Manage Category',
            description: 'Allows the user to manage categories'
        },
        {
            name: 'videoCount',
            label: 'Video Count',
            description: 'Allows the user to manage video count'
        }
    ],
    // checkout: [],
    collection: [
        {
            name: 'manageCollections',
            label: 'Manage Collection',
            description: 'Allows the user to manage collections'
        }
    ],
    deals: [
        {
            name: 'manageDeals',
            label: 'Manage Deals',
            description: 'Allows the user to manage deals'
        }
    ],
    // dealTraces: [],
    // firebase: [],
    follow: [
        {
            name: 'follow',
            label: 'Manage Follow',
            description: 'Allows the user to manage follow'
        }
    ],
    googleAnalytics: [
        {
            name: 'manageGA',
            label: 'Manage Google Analytics',
            description: 'Allows the user to manage Google Analytics'
        }
    ],
    groupBuyCustomerTrack: [
        {
            name: 'getGroupBuy',
            label: 'Manage Group Buy Customer Track',
            description: 'Allows the user to manage Group Buy Customer Track'
        }
    ],
    groupBuyPriceTrace: [
        {
            name: 'manageData',
            label: 'Manage Group Buy Price Trace',
            description: 'Allows the user to manage Group Buy Price Trace'
        }
    ],
    groupBuy: [
        {
            name: 'manageGroupBuy',
            label: 'Manage Group Buy',
            description: 'Allows the user to manage Group Buy'
        }
    ],
    // lambda: [],
    logs: [
        {
            name: 'manageLogs',
            label: 'Manage Logs',
            description: 'Allows the user to manage logs'
        }
    ],
    market: [
        {
            name: 'manageMarket',
            label: 'Manage Market',
            description: 'Allows the user to manage markets'
        }
    ],
    marketplace: [
        {
            name: 'manageMarketplace',
            label: 'Manage Marketplace',
            description: 'Allows the user to manage marketplace'
        }
    ],
    // mybazaargar: [],
    notifications: [
        {
            name: 'notification',
            label: 'Manage Notifications',
            description: 'Allows the user to manage notifications'
        }
    ],
    order: [
        {
            name: 'manageOrders',
            label: 'Manage Order',
            description: 'Allows the user to manage orders'
        },
        {
            name: 'manageAllOrders',
            label: 'Manage All Orders',
            description: 'Allows the user to manage all orders'
        },
        {
            name: 'getOrders',
            label: 'Get Orders',
            description: 'Allows the user to get orders'
        },
        {
            name: 'getOrderTransaction',
            label: 'Get Order Transaction',
            description: 'Allows the user to get order transactions'
        }
    ],
    orderDetail: [
        {
            name: 'manageCart',
            label: 'Manage Cart',
            description: 'Allows the user to manage and update cart details'
        },
        {
            name: 'manageOrderDetails',
            label: 'Manage Order Details',
            description: 'Allows the user to manage order details'
        },
        {
            name: 'oderDetial',
            label: 'Oder Detial',
            description: 'Allows the user to manage order details'
        },
        {
            name: 'adminOrder',
            label: 'Admin Order',
            description: 'Allows the user to manage order details'
        }
    ],
    orderItem: [
        {
            name: 'manageAddress',
            label: 'Manage Address',
            description: 'Allows the user to manage and update address details'
        }
    ],
    orderStatus: [
        {
            name: 'manageStatus',
            label: 'Manage Status',
            description: 'Allows the user to manage status'

        },
        {
            name: 'manageOrderStatus',
            label: 'Manage Order Status',
            description: 'Allows the user to manage order status'
        }
    ],
    package: [
        {
            name: 'manageAddress',
            label: 'Manage Address',
            description: 'Allows the user to manage and update address details'
        }
    ],
    packageItem: [
        {
            name: 'manageAddress',
            label: 'Manage Address',
            description: 'Allows the user to manage and update address details'
        }
    ],
    pageConfig: [
        {
            name: 'managaPageConfig',
            label: 'Manage Page Config',
            description: 'Allows the user to manage Page Config'
        }
    ],
    payment: [
        {
            name: 'managePayments',
            label: 'Manage Payment',
            description: 'Allows the user to manage payments'
        },
        {
            name: 'cardPayment',
            label: 'Card Payment',
            description: 'Grants access to process card payments'
        }
    ],
    // paymentVerification: [],
    product: [
        {
            name: 'manageProducts',
            label: 'Manage Product',
            description: 'Allows the user to manage products'
        },
        {
            name: 'manageVector',
            label: 'Manage Vector',
            description: 'Allows the user to manage vectors'
        },
        {
            name: 'manageHomePage',
            label: 'Manage Home Page',
            description: 'Allows the user to manage home page'
        },
        {
            name: 'manageData',
            label: 'Manage Data',
            description: 'Allows the user to manage data'
        },
        {
            name: 'manageCurrency',
            label: 'Manage Currency',
            description: 'Allows the user to manage currency'
        },
        {
            name: 'manageCategoryLang',
            label: 'Manage Category Lang',
            description: 'Allows the user to manage category lang'
        },
        {
            name: 'csvUpload',
            label: 'CSV Upload',
            description: 'Allows the user to manage csv upload'
        },
        {
            name: 'manageVideoUpload',
            label: 'Manage Video Upload',
            description: 'Allows the user to manage video upload'
        },
        {
            name: 'manageAllProducts',
            label: 'Manage All Products',
            description: 'Allows the user to manage all products'
        },
        {
            name: 'updateSlug',
            label: 'Update Slug',
            description: 'Allows the user to update slug'
        }
    ],
    qAndA: [
        {
            name: 'manageQuestion',
            label: 'Manage Question',
            description: 'Allows the user to manage questions'
        },
        {
            name: 'manageAnswer',
            label: 'Manage Answer',
            description: 'Allows the user to manage answers'
        },
        {
            name: 'manageQa',
            label: 'Manage Qa',
            description: 'Allows the user to manage qa'
        }
    ],
    rbac: [
        {
            name: 'manageRoles',
            label: 'Manage Roles',
            description: 'Allows the user to manage roles'
        },
        {
            name: 'getPermissions',
            label: 'Get Permissions',
            description: 'Allows the user to get permissions'
        }
    ],
    redeemVoucher: [
        {
            name: 'manageVoucher',
            label: 'Manage Voucher',
            description: 'Allows the user to manage vouchers'
        }
    ],
    refund: [
        {
            name: 'manageRefund',
            label: 'Manage Refund',
            description: 'Allows the user to manage refunds'
        },
        {
            name: 'refund',
            label: 'Refund',
            description: 'Allows the user to manage refunds'
        }
    ],
    report: [
        {
            name: 'manageReport',
            label: 'Manage Report',
            description: 'Allows the user to manage reports'
        },
        {
            name: 'reportgeneration',
            label: 'Report Generation',
            description: 'Allows the user to generate reports'
        }
    ],
    result: [
        {
            name: 'manageResults',
            label: 'Manage Results',
            description: 'Allows user to manage results'
        },
        {
            name: 'getResults',
            label: 'Get Results',
            description: 'Allows user to get results'
        }
    ],
    review: [
        {
            name: 'manageReview',
            label: 'Manage Review',
            description: 'Allows the user to manage reviews'
        }
    ],
    // reviewStats: [],
    rrp: [
        {
            name: 'rrpManage',
            label: 'Rrp Manage',
            description: 'Allows the user to manage rrps'
        }
    ],
    sellerConfidentialDetail: [
        {
            name: 'manageSellerConfidentialDetail',
            label: 'Manage Seller Confidential Detail',
            description: 'Allows the user to manage seller confidential details'
        },
        {
            name: 'apiKey',
            label: 'Api Key',
            description: 'Allows the user to manage api keys'
        }
    ],
    sellerDetail: [
        {
            name: 'manageSellerDetail',
            label: 'Manage Seller Detail',
            description: 'Allows the user to manage seller details'
        },
        {
            name: 'manageStore',
            label: 'Manage Store',
            description: 'Allows the user to manage stores'
        },
        {
            name: 'manageData',
            label: 'Manage Data',
            description: 'Allows the user to manage data'
        }
    ],
    setting: [
        {
            name: 'manageSetting',
            label: 'Manage Setting',
            description: 'Allows the user to manage settings'
        }
    ],
    // shippementMethods: [],
    shippment: [
        {
            name: 'manageShippment',
            label: 'Manage Shippment',
            description: 'Allows the user to manage shippments'
        },
        {
            name: 'createShippment',
            label: 'Create Shippment',
            description: 'Allows the user to create shippments'
        },
        {
            name: 'print',
            label: 'Print',
            description: 'Allows the user to print'
        },
        {
            name: 'shippmentStatus',
            label: 'Shippment Status',
            description: 'Allows the user to manage shippment status'
        }
    ],
    // siteMap: [],
    socialToken: [
        {
            name: 'socialToken',
            label: 'Social Token',
            description: 'Allows the user to manage social tokens'
        }
    ],
    stats: [
        {
            name: 'manageVisitStats',
            label: 'Manage Visit Stats',
            description: 'Allows the user to manage visit stats'
        },
        {
            name: 'manageStats',
            label: 'Manage Stats',
            description: 'Allows the user to manage stats'
        }
    ],
    // streaming: [],
    // transaction: [],
    translation: [
        {
            name: 'manageTranslation',
            label: 'Manage Translation',
            description: 'Allows the user to manage translations'
        }
    ],
    user: [
        {
            name: 'manageUsers',
            label: 'Manage Users',
            description: 'Allows the user to manage users'
        },
        {
            name: 'getUsers',
            label: 'Get Users',
            description: 'Allows the user to get users'
        },
        {
            name: 'manageProfile',
            label: 'Manage Profile',
            description: 'Allows the user to manage profile'
        },
        {
            name: 'viewPhone',
            label: 'View Phone',
            description: 'Allows the user to view phone'
        },
        {
            name: 'managePin',
            label: 'Manage Pin',
            description: 'Allows the user to manage pin'
        },
        {
            name: 'validCode',
            label: 'Valid Code',
            description: 'Allows the user to valid code'
        },
        {
            name: 'manageStatus',
            label: 'Manage Status',
            description: 'Allows the user to manage status'
        },
        {
            name: 'changePassword',
            label: 'Change Password',
            description: 'Allows the user to change password'
        },
        {
            name: 'manageRefCode',
            label: 'Manage Ref Code',
            description: 'Allows the user to manage ref code'
        },
        {
            name: 'manageUser',
            label: 'Manage User',
            description: 'Allows user to manage a specific user'
        },
        {
            name: 'manageSchoolUsers',
            label: 'Manage School Users',
            description: 'Allows school admin to manage all users in their school'
        },
        {
            name: 'viewSchoolUsers',
            label: 'View School Users',
            description: 'Allows school admin to view all users in their school'
        },
        {
            name: 'firebaseToken',
            label: 'Firebase Token',
            description: 'Allows managing firebase tokens for notifications'
        },
        {
            name: 'pushNotification',
            label: 'Push Notification',
            description: 'Allows sending push notifications'
        }
    ],
    voucher: [
        {
            name: 'manageVoucher',
            label: 'Manage Voucher',
            description: 'Allows the user to manage vouchers'
        },
        {
            name: 'voucher',
            label: 'Voucher',
            description: 'Allows the user to manage vouchers'
        }
    ],
    wallet: [
        {
            name: 'manageWallet',
            label: 'Manage Wallet',
            description: 'Allows the user to manage wallets'
        }
    ],
    wishList: [
        {
            name: 'manageWishList',
            label: 'Manage Wish List',
            description: 'Allows the user to manage wish lists'
        }
    ],
    assignment: [
        {
            name: 'manageOwnAssignments',
            label: 'Manage Own Assignments',
            description: 'Allows teachers to create, update, delete, and view their own assignments.'
        },
        {
            name: 'viewAllAssignmentsSchool',
            label: 'View All School Assignments',
            description: 'Allows admins to view all assignments within their school.'
        },
        {
            name: 'viewAssignmentsBranch',
            label: 'View Branch Assignments',
            description: 'Allows branch admins to view assignments within their branch.'
        },
        {
            name: 'viewAssignmentsGrade',
            label: 'View Grade Assignments',
            description: 'Allows students to view assignments relevant to their grade.'
        },
        {
            name: 'manageAllAssignmentsSchool',
            label: 'Manage All School Assignments',
            description: 'Allows admins to manage (CRUD) any assignment within their school.'
        },
        {
            name: 'manageAllAssignmentsRoot',
            label: 'Manage All System Assignments (Root)',
            description: 'Allows root users to manage (CRUD) any assignment in the system.'
        }
    ],
    submission: [
        {
            name: 'submitAssignment',
            label: 'Submit Assignment Work',
            description: 'Allows students to submit their work for an assignment.'
        },
        {
            name: 'viewOwnSubmissions',
            label: 'View Own Submissions',
            description: 'Allows students to view their own submitted assignments.'
        },
        {
            name: 'viewAssignmentSubmissions',
            label: 'View Submissions for an Assignment',
            description: 'Allows teachers and admins to view all submissions for a specific assignment.'
        },
        {
            name: 'gradeSubmission',
            label: 'Grade Submission',
            description: 'Allows teachers and admins to grade student submissions.'
        },
        {
            name: 'viewAllSubmissionsSchool',
            label: 'View All School Submissions',
            description: 'Allows admins to view all submissions within their school.'
        },
        {
            name: 'viewAllSubmissionsRoot',
            label: 'View All System Submissions (Root)',
            description: 'Allows root users to view all submissions in the system.'
        }
    ],
    payroll: [
        {
            name: 'managePayrolls',
            label: 'Manage Payrolls',
            description: 'Allows user to manage payrolls'
        },
        {
            name: 'getPayrolls',
            label: 'Get Payrolls',
            description: 'Allows user to get payrolls'
        },
        {
            name: 'getMyPayrolls',
            label: 'Get My Payrolls',
            description: 'Allows user to get their own payrolls'
        }
    ],
    teacherAttendance: [
        {
            name: 'manageTeacherAttendances',
            label: 'Manage Teacher Attendances',
            description: 'Allows user to manage teacher attendances'
        },
        {
            name: 'getTeacherAttendances',
            label: 'Get Teacher Attendances',
            description: 'Allows user to get teacher attendances'
        },
        {
            name: 'viewTeacherAttendances',
            label: 'View Teacher Attendances',
            description: 'Allows user to view teacher attendances (UI/listing)'
        }
    ],
    leavePolicy: [
        {
            name: 'manageLeavePolicies',
            label: 'Manage Leave Policies',
            description: 'Allows user to manage leave policies'
        },
        {
            name: 'getLeavePolicies',
            label: 'Get Leave Policies',
            description: 'Allows user to get leave policies'
        }
    ],
    salarySlip: [
        {
            name: 'manageSalarySlips',
            label: 'Manage Salary Slips',
            description: 'Allows user to manage salary slips'
        },
        {
            name: 'getSalarySlips',
            label: 'Get Salary Slips',
            description: 'Allows user to get salary slips'
        },
        {
            name: 'getMySalarySlips',
            label: 'Get My Salary Slips',
            description: 'Allows user to get their own salary slips'
        }
    ],
    fee: [
        {
            name: 'manageFees',
            label: 'Manage Fees',
            description: 'Allows user to manage fees (create, update, record payment)'
        },
        {
            name: 'viewFees',
            label: 'View Fees',
            description: 'Allows user to view fee records'
        }
    ],
    grade: [
        {
            name: 'manageGrades',
            label: 'Manage Grades',
            description: 'Allows user to manage grades (create, update, delete)'
        },
        {
            name: 'viewGrades',
            label: 'View Grades',
            description: 'Allows user to view grade records'
        }
    ],
    branch: [
        {
            name: 'manageBranches',
            label: 'Manage Branches',
            description: 'Allows user to manage school branches'
        },
        {
            name: 'viewBranches',
            label: 'View Branches',
            description: 'Allows user to view school branches'
        }
    ],
    attendance: [
        {
            name: 'manageAttendances',
            label: 'Manage Attendances',
            description: 'Allows user to mark and update student attendances'
        },
        {
            name: 'viewAttendances',
            label: 'View Attendances',
            description: 'Allows user to view attendance records'
        },
        {
            name: 'attendanceManagement',
            label: 'Attendance Management',
            description: 'General attendance management permissions'
        }
    ],
    subject: [
        {
            name: 'manageSubjects',
            label: 'Manage Subjects',
            description: 'Allows user to manage school subjects'
        },
        {
            name: 'viewSubjects',
            label: 'View Subjects',
            description: 'Allows user to view school subjects'
        },
        {
            name: 'subjectManagement',
            label: 'Subject Management',
            description: 'General subject management permissions'
        },
        {
            name: 'subject',
            label: 'Subject',
            description: 'Subject related operations'
        }
    ],
    exam: [
        {
            name: 'manageExams',
            label: 'Manage Exams',
            description: 'Allows user to manage exams'
        },
        {
            name: 'getExams',
            label: 'Get Exams',
            description: 'Allows user to view exams'
        },
        {
            name: 'announceExam',
            label: 'Announce Exam',
            description: 'Allows user to announce exams'
        }
    ],
    datesheet: [
        {
            name: 'manageDateSheets',
            label: 'Manage Date Sheets',
            description: 'Allows user to manage date sheets'
        },
        {
            name: 'getDateSheets',
            label: 'Get Date Sheets',
            description: 'Allows user to view date sheets'
        }
    ],
    classSchedule: [
        {
            name: 'manageClassSchedules',
            label: 'Manage Class Schedules',
            description: 'Allows user to manage class schedules'
        },
        {
            name: 'viewClassSchedules',
            label: 'View Class Schedules',
            description: 'Allows user to view class schedules'
        },
        {
            name: 'viewOwnClassSchedule',
            label: 'View Own Class Schedule',
            description: 'Allows teachers to view their own class schedule'
        }
    ],
    syllabus: [
        {
            name: 'manageSyllabus',
            label: 'Manage Syllabus',
            description: 'Allows user to manage syllabus'
        },
        {
            name: 'viewSyllabus',
            label: 'View Syllabus',
            description: 'Allows user to view syllabus'
        },
        {
            name: 'viewOwnSyllabus',
            label: 'View Own Syllabus',
            description: 'Allows teachers/students to view their own syllabus'
        }
    ],
    certificate: [
        {
            name: 'manageCertificates',
            label: 'Manage Certificates',
            description: 'Allows user to manage certificates'
        },
        {
            name: 'viewCertificates',
            label: 'View Certificates',
            description: 'Allows user to view certificates'
        },
        {
            name: 'generateCertificate',
            label: 'Generate Certificate',
            description: 'Allows user to generate certificates'
        },
        {
            name: 'manageSchoolLogo',
            label: 'Manage School Logo',
            description: 'Allows user to manage school logo'
        }
    ],
    complaint: [
        {
            name: 'manageComplaints',
            label: 'Manage Complaints',
            description: 'Allows user to manage complaints'
        },
        {
            name: 'viewComplaints',
            label: 'View Complaints',
            description: 'Allows user to view complaints'
        },
        {
            name: 'respondComplaints',
            label: 'Respond Complaints',
            description: 'Allows user to respond to complaints'
        },
        {
            name: 'deleteComplaints',
            label: 'Delete Complaints',
            description: 'Allows user to delete complaints'
        }
    ],
    test: [
        {
            name: 'manageTests',
            label: 'Manage Tests',
            description: 'Allows user to manage tests'
        },
        {
            name: 'viewTests',
            label: 'View Tests',
            description: 'Allows user to view tests'
        },
        {
            name: 'testManagement',
            label: 'Test Management',
            description: 'General test management permissions'
        }
    ],
    testResult: [
        {
            name: 'manageTestResults',
            label: 'Manage Test Results',
            description: 'Allows user to manage test results'
        },
        {
            name: 'viewTestResults',
            label: 'View Test Results',
            description: 'Allows user to view test results'
        },
        {
            name: 'testResultManagement',
            label: 'Test Result Management',
            description: 'General test result management permissions'
        }
    ],
    paper: [
        {
            name: 'managePapers',
            label: 'Manage Papers',
            description: 'Allows user to manage papers'
        },
        {
            name: 'viewPapers',
            label: 'View Papers',
            description: 'Allows user to view papers'
        }
    ],
    fine: [
        {
            name: 'manageFines',
            label: 'Manage Fines',
            description: 'Allows user to manage fines'
        },
        {
            name: 'viewFines',
            label: 'View Fines',
            description: 'Allows user to view fines'
        }
    ],
    salary: [
        {
            name: 'manageSalaries',
            label: 'Manage Salaries',
            description: 'Allows user to manage salaries'
        },
        {
            name: 'getSalaries',
            label: 'Get Salaries',
            description: 'Allows user to get salaries'
        }
    ]
};

module.exports = permissions;
