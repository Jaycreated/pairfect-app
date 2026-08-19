const https = require('https');
const fs = require('fs');

const TOKENS = {
  johnson: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3OTE5Njg5MiwiZXhwIjoxNzc5ODAxNjkyfQ.IkirUvBtH-0e5jI-JY0AvUnX5Yw3y6036Al__7CntgQ",
  carrick: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiaWF0IjoxNzc5MjAwMTcwLCJleHAiOjE3Nzk4MDQ5NzB9.To1ZPpOa13wMxEOBpw780sDoGgEF6TSeMgyQclxN4Fw"
};

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
  try {
    console.log('--- JOHNSON ---');
    const johnsonMatches = await makeRequest('https://pairfect.com.ng/api/matches', 'GET', TOKENS.johnson);
    console.log('Johnson Matches status:', johnsonMatches.status);
    console.log('Johnson Matches data:', JSON.stringify(johnsonMatches.data, null, 2));

    const johnsonConvs = await makeRequest('https://pairfect.com.ng/api/conversations', 'GET', TOKENS.johnson);
    console.log('Johnson Conversations data:', JSON.stringify(johnsonConvs.data, null, 2));

    console.log('\n--- CARRICK ---');
    const carrickMatches = await makeRequest('https://pairfect.com.ng/api/matches', 'GET', TOKENS.carrick);
    console.log('Carrick Matches status:', carrickMatches.status);
    console.log('Carrick Matches data:', JSON.stringify(carrickMatches.data, null, 2));

    const carrickConvs = await makeRequest('https://pairfect.com.ng/api/conversations', 'GET', TOKENS.carrick);
    console.log('Carrick Conversations data:', JSON.stringify(carrickConvs.data, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
