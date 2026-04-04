const express = require('express');

const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const rbacController = require('./rbac.controller')
const rbacValidation = require('./rbac.validation')

const router = express.Router();





router
    .route('/')
    .post(auth('manageRoles'), validate(rbacValidation.createRole), rbacController.createRole)
    .get(auth('manageRoles'), validate(rbacValidation.getRoles),rbacController.getRoles);

router
.route('/cronjob')
.get(rbacController.accessCronJob)

router.route('/all-accesses')
    .get(auth('manageRoles'),rbacController.getAllAccesses)
router
    .route('/accesses')
    .get(auth('getPermissions'), rbacController.findRoleById)
router
    .route('/:id')
    .patch(auth('manageRoles'), validate(rbacValidation.updateRole), rbacController.updateRole)
router.route('/:id')
    .delete(auth('manageRoles'), validate(rbacValidation.findRoleById), rbacController.deleteRole)



module.exports = router;

