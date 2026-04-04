const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { connectDB } = require('../config/mongoose');
const User = require('../app/user/user.model');

function getArg(name) {
  const idx = process.argv.findIndex((arg) => arg === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function run() {
  const email = getArg('email') || process.env.PLATFORM_ADMIN_EMAIL || null;
  const password = getArg('password') || process.env.PLATFORM_ADMIN_PASSWORD || null;
  const fullname = getArg('name') || process.env.PLATFORM_ADMIN_NAME || 'Platform Admin';

  if (!email || !password) {
    console.error('Usage: node scripts/create-platform-admin.js --email <email> --password <password> [--name "Platform Admin"]');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const updates = {};
    if (existing.role !== 'platformAdmin') updates.role = 'platformAdmin';
    if (!existing.isEmailVarified) updates.isEmailVarified = true;
    if (!existing.fullname) updates.fullname = fullname;

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(existing._id, { $set: updates }, { new: true });
      console.log(`Updated existing user as platformAdmin: ${email.toLowerCase()}`);
    } else {
      console.log(`User already exists as platformAdmin: ${email.toLowerCase()}`);
    }
    process.exit(0);
  }

  const user = await User.create({
    fullname,
    email: email.toLowerCase(),
    password,
    role: 'platformAdmin',
    isEmailVarified: true,
    verificationMethod: 'email',
    status: 'active',
  });

  console.log(`Created platformAdmin user: ${user.email}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to create platformAdmin:', err.message || err);
  process.exit(1);
});
