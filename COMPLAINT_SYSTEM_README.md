# Complaint & Report System

This document outlines the complete complaint and report system implemented for the school management system.

## Features Implemented

### Backend Implementation

#### 1. Database Model (`complaint.model.js`)
- **Comprehensive Schema**: Supports all complaint types (teacher, subject, admin, branch, grade, general, student)
- **Role-based Fields**: Different target fields based on complaint type
- **Response System**: Embedded responses with full tracking
- **Status Management**: Complete lifecycle (pending → in-progress → resolved → closed)
- **School Isolation**: Every complaint is scoped to a specific school
- **Audit Trail**: Complete tracking of escalations, assignments, and resolutions

#### 2. Service Layer (`complaint.service.js`)
- **Role-based Access Control**: Different permissions for each user role
- **School-scoped Queries**: Users only see complaints from their school
- **Target Validation**: Ensures complaint targets exist in the same school
- **Notification System**: Placeholder for email/SMS notifications
- **Statistics Generation**: Comprehensive stats for admins

#### 3. API Routes (`complaint.routes.js`)
- **RESTful API**: Full CRUD operations
- **Role-based Endpoints**: Different endpoints for different user types
- **Response Management**: Separate endpoints for managing responses
- **Assignment & Escalation**: Admin functions for complaint management
- **Swagger Documentation**: Complete API documentation

#### 4. Validation (`complaint.validation.js`)
- **Conditional Validation**: Fields required based on complaint type
- **Input Sanitization**: Prevents malicious input
- **Business Rule Validation**: Ensures data consistency

### Frontend Implementation

#### 1. Service Layer (`complaintService.js`)
- **API Integration**: Complete API wrapper
- **Error Handling**: Standardized error management
- **Authentication**: Automatic token handling

#### 2. Shared Components
- **ComplaintForm**: Dynamic form based on user role and complaint type
- **ComplaintCard**: Rich display with action buttons
- **ComplaintList**: Comprehensive list with filtering and pagination
- **ComplaintStats**: Visual statistics dashboard

#### 3. Role-specific Pages
- **Student Complaints**: Students can file complaints against teachers, subjects, admin
- **Teacher Complaints**: Teachers can file reports against students and respond to complaints
- **Admin Complaints**: Full management interface for all complaints
- **Super Admin Complaints**: System-wide oversight

## Role-based Access Control

### Students
- **Can Create**: Complaints against teachers, subjects, admin, branch, grade
- **Can View**: Own complaints and complaints filed against them
- **Cannot**: See general complaints, respond to complaints, assign or delete

### Teachers  
- **Can Create**: Reports against students, complaints against admin/branch
- **Can View**: Own complaints, complaints against them, complaints about their students
- **Can Respond**: To complaints filed against them or assigned to them
- **Cannot**: See general complaints, assign complaints to others, delete complaints

### Admins & Super Admins
- **Can Create**: Any type of complaint including general infrastructure complaints
- **Can View**: All complaints in their school
- **Can Respond**: To any complaint
- **Can Assign**: Complaints to staff members
- **Can Delete**: Complaints (with audit trail)
- **Can Escalate**: Complaints for higher priority handling

## Security Features

### School Isolation
- Every complaint is tied to a specific school via `schoolId`
- Users can only access complaints from their own school
- API endpoints enforce school-based filtering

### Authentication & Authorization
- JWT-based authentication
- Role-based permissions
- Action-level authorization checks

### Data Validation
- Input sanitization at API level
- Business rule validation
- XSS and injection protection

## Notification System (Placeholder)

The system includes hooks for notifications:
- **On Complaint Creation**: Notify relevant parties based on complaint type
- **On Response**: Notify complaint creator
- **On Assignment**: Notify assigned personnel
- **On Escalation**: Notify higher authorities
- **On Resolution**: Notify all involved parties

## Database Indexes

Optimized database queries with indexes on:
- `schoolId` + `status`
- `complainantId` + `createdAt`
- `targetTeacherId` + `status`
- `targetStudentId` + `status`
- `assignedTo` + `status`
- `complaintType` + `schoolId`

## API Endpoints

```
GET    /complaints                    - Get all complaints (with role-based filtering)
POST   /complaints                    - Create new complaint
GET    /complaints/stats              - Get complaint statistics
GET    /complaints/my-complaints      - Get current user's complaints
GET    /complaints/against-me         - Get complaints filed against current user
GET    /complaints/assigned           - Get complaints assigned to current user
GET    /complaints/search-users       - Search users for complaint targets

GET    /complaints/:id                - Get specific complaint
PATCH  /complaints/:id                - Update complaint
DELETE /complaints/:id                - Delete complaint (admin only)

POST   /complaints/:id/responses      - Add response to complaint
GET    /complaints/:id/responses      - Get complaint responses
PATCH  /complaints/:id/responses/:rid - Update response
DELETE /complaints/:id/responses/:rid - Delete response

PATCH  /complaints/:id/assign         - Assign complaint to user
PATCH  /complaints/:id/escalate       - Escalate complaint
PATCH  /complaints/:id/resolve        - Resolve complaint
```

## Usage Examples

### Creating a Complaint (Student against Teacher)
```javascript
const complaint = {
  title: "Teacher behavior issue",
  description: "The teacher was rude to students",
  complaintType: "teacher",
  targetTeacherId: "60f1b2b3c4d5e6f7a8b9c0d1",
  priority: "medium"
};
```

### Creating a General Complaint
```javascript
const complaint = {
  title: "Water supply issue",
  description: "No water in washrooms since morning",
  complaintType: "general",
  generalCategory: "water",
  isUrgent: true
};
```

### Filing a Report (Teacher against Student)
```javascript
const report = {
  title: "Student misbehavior",
  description: "Student disrupting class repeatedly",
  complaintType: "student",
  targetStudentId: "60f1b2b3c4d5e6f7a8b9c0d2",
  priority: "high"
};
```

## Installation & Setup

### Backend
1. The complaint routes are already integrated into the main routes file
2. Database model is registered in mongoose configuration
3. Permissions are added to the roles configuration
4. No additional setup required

### Frontend
1. Components are organized under `pages/Shared/Complaints/`
2. Role-specific pages are in respective role directories
3. Service layer handles all API communication
4. No additional routing setup required - components can be imported and used

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for instant updates
2. **File Attachments**: Support for uploading evidence files
3. **Email Integration**: Automated email notifications
4. **SMS Notifications**: Critical complaint alerts via SMS
5. **Analytics Dashboard**: Advanced reporting and insights
6. **Mobile App**: Dedicated mobile application
7. **Integration**: Connect with existing school communication systems

This system provides a comprehensive solution for managing complaints and reports in a school environment with proper security, role-based access control, and scalability considerations.
