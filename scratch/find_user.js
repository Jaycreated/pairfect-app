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
  for (let idx = 0; idx < TOKENS.length; idx++) {
    const token = TOKENS[idx];
    try {
      console.log(`\n=================== TOKEN ${idx} ===================`);
      const pmRes = await makeRequest('https://pairfect.com.ng/api/users/potential-matches', 'GET', token);
      console.log('PM Status:', pmRes.status);
      const matches = pmRes.data?.matches || [];
      console.log(`Found ${matches.length} potential matches`);
      for (const m of matches) {
        if (m.name && m.name.toLowerCase().includes('carrick')) {
          console.log('Found Michael Carrick in potential matches!', JSON.stringify(m, null, 2));
        }
      }

      // Check conversations
      const convRes = await makeRequest('https://pairfect.com.ng/api/conversations', 'GET', token);
      const convs = convRes.data?.conversations || convRes.data || [];
      for (const c of convs) {
        if (c.name && c.name.toLowerCase().includes('carrick')) {
          console.log('Found Michael Carrick in conversations!', JSON.stringify(c, null, 2));
          // Fetch messages
          const msgRes = await makeRequest(`https://pairfect.com.ng/api/messages/${c.id || c._id}`, 'GET', token);
          console.log('Messages with Michael Carrick:', JSON.stringify(msgRes.data, null, 2));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}

run();
