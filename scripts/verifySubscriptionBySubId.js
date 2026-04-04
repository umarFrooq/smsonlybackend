require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const axios = require('axios');

async function main(){
  const subId = process.argv[2];
  if(!subId){
    console.error('Usage: node verifySubscriptionBySubId.js <subscriptionId> [serverBaseUrl]');
    process.exit(2);
  }
  const server = process.argv[3] || 'http://localhost:3000';
  try{
    console.log('Searching checkout sessions for subscription', subId);
    const sessions = await stripe.checkout.sessions.list({limit: 10, subscription: subId});
    if(!sessions || !sessions.data || sessions.data.length === 0){
      console.error('No checkout sessions found for subscription', subId);
      process.exit(3);
    }
    const session = sessions.data[0];
    console.log('Found session:', session.id);
    // Call server verify endpoint
    const resp = await axios.post(`${server}/v1/subscriptions/verify-session`, { sessionId: session.id }, { timeout: 30000 });
    console.log('Server response:', resp.data);
  }catch(err){
    console.error('Error:', err.response ? (err.response.data || err.response.statusText) : err.message);
    process.exit(1);
  }
}

main();
