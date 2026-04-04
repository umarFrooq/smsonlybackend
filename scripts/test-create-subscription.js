const axios = require('axios');

async function run() {
  try {
    const res = await axios.post('http://localhost:3000/v1/subscriptions/create-subscription', {
      planKey: 'premium',
      schoolId: 'test-school-123',
      studentCount: 5
    }, { headers: { 'Content-Type': 'application/json' } });
    console.log('Response:', res.data);
  } catch (err) {
    if (err.response) console.error('Error response:', err.response.status, err.response.data);
    else console.error('Error', err.message);
    process.exit(1);
  }
}

run();
