// Test script to check available endpoints
const endpoints = [
  'GET /api/users/profile',
  'DELETE /api/users/account', 
  'GET /api/users',
  'DELETE /api/user/account',
  'DELETE /api/account',
  'GET /api/auth/me',
  'POST /api/auth/logout'
];

const baseUrl = 'https://pairfect.com.ng';

async function testEndpoint(method, path) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add a real token here for authenticated endpoints
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    console.log(`${method} ${path}: ${response.status} ${response.statusText}`);
    return { status: response.status, success: response.ok };
  } catch (error) {
    console.log(`${method} ${path}: ERROR - ${error.message}`);
    return { status: 'ERROR', success: false };
  }
}

// Test all endpoints
async function runTests() {
  console.log('Testing endpoints on:', baseUrl);
  console.log('='.repeat(50));
  
  for (const endpoint of endpoints) {
    const [method, path] = endpoint.split(' ');
    await testEndpoint(method, path);
  }
  
  console.log('='.repeat(50));
}

runTests();
