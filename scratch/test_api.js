const https = require('https');
const fs = require('fs');

const TOKENS = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3OTE5Njg5MiwiZXhwIjoxNzc5ODAxNjkyfQ.IkirUvBtH-0e5jI-JY0AvUnX5Yw3y6036Al__7CntgQ",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMiwiaWF0IjoxNzc5MTEwMDkzLCJleHAiOjE3Nzk3MTQ4OTN9.AVg8mDQzA3ny0-maKCagj8gpMlOnAVER-6CB-wseye4"
];

function makeRequest(url, method, token, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  const results = {};

  for (let idx = 0; idx < TOKENS.length; idx++) {
    const token = TOKENS[idx];
    try {
      console.log(`\n=================== CHECKING TOKEN ${idx} ===================`);
      const profileRes = await makeRequest('https://pairfect.com.ng/api/users/profile', 'GET', token);
      console.log(`Profile request status: ${profileRes.status}`);
      
      const user = profileRes.data?.user || profileRes.data?.data || profileRes.data;
      console.log('Profile User:', JSON.stringify(user, null, 2));

      const key = user?.name ? `${user.name}_${user.id}` : `token_${idx}`;
      results[key] = {
        user,
        conversations: null,
        messages: {}
      };

      // Get conversations
      const convRes = await makeRequest('https://pairfect.com.ng/api/conversations', 'GET', token);
      console.log(`Conversations status: ${convRes.status}`);
      
      const conversations = convRes.data?.conversations || convRes.data || [];
      if (convRes.status === 200) {
        results[key].conversations = conversations;
        
        for (const conv of conversations) {
          const convId = conv.id || conv._id;
          console.log(`Fetching messages for conversation ID: ${convId}`);
          const msgRes = await makeRequest(`https://pairfect.com.ng/api/messages/${convId}`, 'GET', token);
          console.log(`Messages for conversation ${convId} status: ${msgRes.status}`);
          console.log(`Raw messages for conversation ${convId}:`, JSON.stringify(msgRes.data, null, 2));
          results[key].messages[convId] = {
            status: msgRes.status,
            data: msgRes.data
          };
        }
      }
    } catch (err) {
      console.error('Error checking token:', err);
    }
  }

  fs.writeFileSync('/Users/mac/Pairfect/scratch_debug.json', JSON.stringify(results, null, 2));
  console.log('\nSaved debug results to scratch_debug.json');
}

run();
