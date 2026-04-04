const mongoose = require('mongoose');
const GeneratedCertificate = require('./app/certificate/generated.model.js');
require('dotenv').config();

const url = "mongodb+srv://umar:abc@cluster0.brxnmks.mongodb.net/test";

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    const cert = await GeneratedCertificate.findById('6920e8b590024fbe56bcfdba');
    console.log('Certificate:', cert);
    process.exit(0);
  })
  .catch((err) => {
    console.error('DB connection error:', err);
    process.exit(1);
  });
