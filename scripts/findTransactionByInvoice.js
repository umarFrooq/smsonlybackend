const mongoose = require('mongoose');
const BillingTransaction = require('../models/BillingTransaction');
require('dotenv').config();
(async ()=>{
  const invoice = process.argv[2];
  if(!invoice){ console.error('usage: node findTransactionByInvoice.js <invoiceId>'); process.exit(2); }
  const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/stmsbackend';
  try{
    await mongoose.connect(mongoUrl, { useNewUrlParser:true, useUnifiedTopology:true });
    const txs = await BillingTransaction.find({ invoiceId: invoice }).sort({ createdAt: -1 }).lean();
    console.log('Found', txs.length, 'transactions for', invoice);
    console.log(JSON.stringify(txs, null, 2));
    await mongoose.disconnect();
  }catch(e){ console.error(e); try{ await mongoose.disconnect(); }catch{}; process.exit(1); }
})();
