const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const complaintValidation = require('./complaint.validation');
const complaintController = require('./complaint.controller');
const responseService = require('./response.service');

// Apply authentication and school scope to all routes
router.use(auth(), schoolScopeMiddleware);

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Complaint and Report Management System
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Complaint:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - complaintType
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Brief title of the complaint
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Detailed description of the complaint
 *         complaintType:
 *           type: string
 *           enum: [teacher, subject, admin, branch, grade, general, student]
 *           description: Type of complaint
 *         targetTeacherId:
 *           type: string
 *           description: Teacher ID (required when complaintType is 'teacher')
 *         targetSubjectId:
 *           type: string
 *           description: Subject ID (required when complaintType is 'subject')
 *         targetAdminId:
 *           type: string
 *           description: Admin ID (required when complaintType is 'admin')
 *         targetStudentId:
 *           type: string
 *           description: Student ID (required when complaintType is 'student')
 *         targetBranchId:
 *           type: string
 *           description: Branch ID (required when complaintType is 'branch')
 *         targetGradeId:
 *           type: string
 *           description: Grade ID (required when complaintType is 'grade')
 *         generalCategory:
 *           type: string
 *           enum: [water, building, transport, electricity, cleanliness, cafeteria, library, playground, other]
 *           description: Category for general complaints
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *         isAnonymous:
 *           type: boolean
 *           default: false
 *         isUrgent:
 *           type: boolean
 *           default: false
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorization
 *     ComplaintResponse:
 *       type: object
 *       required:
 *         - response
 *       properties:
 *         response:
 *           type: string
 *           maxLength: 1000
 *           description: Response text
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               url:
 *                 type: string
 */

// Main complaint routes
router
  .route('/')
  .post(
    auth('manageComplaints'),
    validate(complaintValidation.createComplaint),
    complaintController.createComplaint
  )
  .get(
    auth('viewComplaints'),
    validate(complaintValidation.getComplaints),
    complaintController.getComplaints
  );

// Complaint stats
router
  .route('/stats')
  .get(
    auth('viewComplaints'),
    validate(complaintValidation.getComplaintStats),
    complaintController.getComplaintStats
  );

// My complaints (complaints filed by current user)
router
  .route('/my-complaints')
  .get(
    auth('viewComplaints'),
    validate(complaintValidation.getComplaints),
    complaintController.getMyComplaints
  );

// Complaints against me (current user as target)
router
  .route('/against-me')
  .get(
    auth('viewComplaints'),
    validate(complaintValidation.getComplaints),
    complaintController.getComplaintsAgainstMe
  );

// Assigned complaints (complaints assigned to current user)
router
  .route('/assigned')
  .get(
    auth('manageComplaints'),
    validate(complaintValidation.getComplaints),
    complaintController.getAssignedComplaints
  );

// Search users for complaint targets
router
  .route('/search-users')
  .get(
    auth('viewComplaints'),
    complaintController.searchUsers
  );

// Individual complaint routes
router
  .route('/:complaintId')
  .get(
    auth('viewComplaints'),
    validate(complaintValidation.getComplaint),
    complaintController.getComplaint
  )
  .patch(
    auth('manageComplaints'),
    validate(complaintValidation.updateComplaint),
    complaintController.updateComplaint
  )
  .delete(
    auth('deleteComplaints'),
    validate(complaintValidation.deleteComplaint),
    complaintController.deleteComplaint
  );

// Complaint assignment
router
  .route('/:complaintId/assign')
  .patch(
    auth('manageComplaints'),
    validate(complaintValidation.assignComplaint),
    complaintController.assignComplaint
  );

// Complaint escalation
router
  .route('/:complaintId/escalate')
  .patch(
    auth('manageComplaints'),
    validate(complaintValidation.escalateComplaint),
    complaintController.escalateComplaint
  );

// Complaint resolution
router
  .route('/:complaintId/resolve')
  .patch(
    auth('manageComplaints'),
    validate(complaintValidation.resolveComplaint),
    complaintController.resolveComplaint
  );

// Response management
router
  .route('/:complaintId/responses')
  .post(
    auth('respondComplaints'),
    validate(complaintValidation.addResponse),
    complaintController.addResponse
  )
  .get(
    auth('viewComplaints'),
    validate(complaintValidation.getComplaint),
    async (req, res, next) => {
      try {
        const result = await responseService.getResponses(req.params.complaintId, req.user);
        res.status(result.status).send(result);
      } catch (error) {
        next(error);
      }
    }
  );

// Individual response management
router
  .route('/:complaintId/responses/:responseId')
  .patch(
    auth('respondComplaints'),
    async (req, res, next) => {
      try {
        const result = await responseService.updateResponse(
          req.params.complaintId,
          req.params.responseId,
          req.body,
          req.user
        );
        res.status(result.status).send(result);
      } catch (error) {
        next(error);
      }
    }
  )
  .delete(
    auth('respondComplaints'),
    async (req, res, next) => {
      try {
        const result = await responseService.deleteResponse(
          req.params.complaintId,
          req.params.responseId,
          req.user
        );
        res.status(result.status).send(result);
      } catch (error) {
        next(error);
      }
    }
  );

module.exports = router;

/**
 * @swagger
 * /complaints:
 *   post:
 *     summary: Create a new complaint
 *     description: Create a new complaint or report. Users can file complaints against teachers, subjects, admins, or general infrastructure issues. Teachers and admins can file reports against students.
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Complaint'
 *           examples:
 *             teacher_complaint:
 *               summary: Complaint against teacher
 *               value:
 *                 title: "Teacher behavior issue"
 *                 description: "The teacher was rude to students in class"
 *                 complaintType: "teacher"
 *                 targetTeacherId: "60f1b2b3c4d5e6f7a8b9c0d1"
 *                 priority: "medium"
 *             general_complaint:
 *               summary: General infrastructure complaint
 *               value:
 *                 title: "Water supply issue"
 *                 description: "No water in the school washrooms since morning"
 *                 complaintType: "general"
 *                 generalCategory: "water"
 *                 isUrgent: true
 *             student_report:
 *               summary: Report against student
 *               value:
 *                 title: "Student misbehavior"
 *                 description: "Student was disrupting class and being disrespectful"
 *                 complaintType: "student"
 *                 targetStudentId: "60f1b2b3c4d5e6f7a8b9c0d2"
 *                 priority: "high"
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Complaint created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Get all complaints
 *     description: Retrieve complaints with role-based filtering. Admins see all complaints, teachers see complaints related to them, students/parents see their own complaints.
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: complaintType
 *         schema:
 *           type: string
 *           enum: [teacher, subject, admin, branch, grade, general, student]
 *         description: Filter by complaint type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, closed, reopened]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter complaints from this date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter complaints to this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of complaints per page
 *     responses:
 *       200:
 *         description: Complaints retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /complaints/{complaintId}:
 *   get:
 *     summary: Get a specific complaint
 *     description: Retrieve a complaint by ID with role-based access control
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint retrieved successfully
 *       404:
 *         description: Complaint not found
 *       403:
 *         description: Access denied
 *   patch:
 *     summary: Update a complaint
 *     description: Update complaint details. Users can only update their own complaints if not responded yet. Admins can update any complaint.
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, resolved, closed, reopened]
 *               assignedTo:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Complaint updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Complaint not found
 *   delete:
 *     summary: Delete a complaint
 *     description: Delete a complaint (admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       204:
 *         description: Complaint deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Complaint not found
 */

/**
 * @swagger
 * /complaints/{complaintId}/responses:
 *   post:
 *     summary: Add a response to a complaint
 *     description: Add a response to a complaint. Admins, assigned users, and targeted users can respond.
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComplaintResponse'
 *     responses:
 *       200:
 *         description: Response added successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Complaint not found
 */

/**
 * @swagger
 * /complaints/stats:
 *   get:
 *     summary: Get complaint statistics
 *     description: Get complaint statistics including counts by status, type, and priority
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter statistics from this date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter statistics to this date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Filter by branch
 *       - in: query
 *         name: gradeId
 *         schema:
 *           type: string
 *         description: Filter by grade
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Complaint statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         inProgress:
 *                           type: integer
 *                         resolved:
 *                           type: integer
 *                         closed:
 *                           type: integer
 *                         urgent:
 *                           type: integer
 *                         overdue:
 *                           type: integer
 *                     byType:
 *                       type: object
 *                     byPriority:
 *                       type: object
 */
