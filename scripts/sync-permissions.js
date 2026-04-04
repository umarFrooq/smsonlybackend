require('module-alias/register');
const mongoose = require('mongoose');
const config = require('../config/config');
const Rbac = require('../app/rbac/rbac.model');
const Accesses = require('../app/rbac-access/access.model');
const permissions = require('../app/rbac/permissions');
const { roles, roleRights } = require('../config/roles');

mongoose.connect(config.mongo.url, config.mongo.options).then(async () => {
  console.log('Connected to MongoDB');
  try {
    // 1. Sync all permissions
    for (const [moduleName, perms] of Object.entries(permissions)) {
      for (const perm of perms) {
        await Accesses.updateOne(
          { name: perm.name },
          { $set: { label: perm.label, description: perm.description, module: moduleName } },
          { upsert: true }
        );
      }
    }
    console.log('Permissions synced.');

    // 2. Sync all roles
    for (const roleName of roles) {
      const rights = roleRights.get(roleName) || [];
      const accessDocs = await Accesses.find({ name: { $in: rights } });
      const accessIds = accessDocs.map(doc => doc._id);
      
      await Rbac.updateOne(
        { role: roleName },
        { $set: { access: accessIds } },
        { upsert: true }
      );
      console.log(`Role ${roleName} synced with ${accessIds.length} permissions.`);
    }
  } catch (err) {
    console.error('Error syncing:', err);
  } finally {
    process.exit(0);
  }
});
