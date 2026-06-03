const https = require('https');
const fs = require('fs');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiaWF0IjoxNzc5MjAwMTcwLCJleHAiOjE3Nzk4MDQ5NzB9.To1ZPpOa13wMxEOBpw780sDoGgEF6TSeMgyQclxN4Fw";

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
  try {
    console.log(`Checking profile...`);
    const profileRes = await makeRequest('https://pairfect.com.ng/api/users/profile', 'GET', TOKEN);
    console.log(`Profile status: ${profileRes.status}`);

    // Check matches
    console.log('Checking matches endpoint...');
    const matchRes = await makeRequest('https://pairfect.com.ng/api/matches', 'GET', TOKEN);
    console.log('Matches status:', matchRes.status);
    console.log('Matches data:', JSON.stringify(matchRes.data, null, 2));

    // Check potential matches
    console.log('Checking potential matches...');
    const pmRes = await makeRequest('https://pairfect.com.ng/api/users/potential-matches', 'GET', TOKEN);
    console.log('PM status:', pmRes.status);
    console.log('PM count:', pmRes.data?.matches?.length);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
