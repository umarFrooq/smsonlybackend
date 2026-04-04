const mongoose = require('mongoose');
require('dotenv').config();
const db = require('../config/mongoose');

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/stmsbackend';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const User = db.User;
  const user = await User.findOne({ email: 'umar@gmail.com' }).lean();
  console.log('User:', user ? { _id: user._id, email: user.email, role: user.role, schoolId: user.schoolId } : 'Not found');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
