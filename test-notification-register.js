// Test script for /notifications/register POST endpoint

// Test configuration - update these values
const TEST_CONFIG = {
  // Your backend URL (from .env or config)
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://pairfect.com.ng/api',
  
  // Test auth token (get this from a logged-in user)
  AUTH_TOKEN: 'YOUR_AUTH_TOKEN_HERE', // Replace with a real token
  
  // Test push token (Expo push token format)
  PUSH_TOKEN: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' // Replace with a real Expo push token
};

async function testNotificationRegister() {
  console.log('Testing /notifications/register POST endpoint');
  console.log('='.repeat(50));
  
  const url = `${TEST_CONFIG.BASE_URL}/notifications/register`;
  
  const payload = {
    pushToken: TEST_CONFIG.PUSH_TOKEN
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Add auth token if provided
  if (TEST_CONFIG.AUTH_TOKEN && TEST_CONFIG.AUTH_TOKEN !== 'YOUR_AUTH_TOKEN_HERE') {
    headers['Authorization'] = `Bearer ${TEST_CONFIG.AUTH_TOKEN}`;
    console.log('✅ Using auth token');
  } else {
    console.log('⚠️  No auth token provided - endpoint may require authentication');
  }
  
  try {
    console.log('📡 Request URL:', url);
    console.log('📦 Request payload:', payload);
    console.log('🔐 Request headers:', headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json().catch(() => ({}));
    console.log('📄 Response data:', responseData);
    
    if (response.ok) {
      console.log('✅ SUCCESS: Push token registered successfully');
    } else {
      console.log('❌ FAILED: Server returned error');
      console.log('Error details:', responseData);
    }
    
  } catch (error) {
    console.error('💥 NETWORK ERROR:', error.message);
    console.log('Possible causes:');
    console.log('- Backend server is not running');
    console.log('- Network connectivity issues');
    console.log('- CORS configuration problems');
    console.log('- Invalid URL');
  }
  
  console.log('='.repeat(50));
}

// Test without auth token (to see if endpoint requires auth)
async function testWithoutAuth() {
  console.log('\nTesting without authentication token...');
  
  const url = `${TEST_CONFIG.BASE_URL}/notifications/register`;
  const payload = { pushToken: TEST_CONFIG.PUSH_TOKEN };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const responseData = await response.json().catch(() => ({}));
    
    console.log('Status:', response.status);
    console.log('Response:', responseData);
    
    if (response.status === 401) {
      console.log('✅ Endpoint correctly requires authentication');
    } else if (response.ok) {
      console.log('⚠️  Endpoint works without auth (may be intentional)');
    } else {
      console.log('❌ Unexpected error');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testNotificationRegister();
  await testWithoutAuth();
  
  console.log('\n📋 Test Summary:');
  console.log('- Update TEST_CONFIG.AUTH_TOKEN with a real token');
  console.log('- Update TEST_CONFIG.PUSH_TOKEN with a real Expo push token');
  console.log('- Ensure your backend server is running');
  console.log('- Check CORS configuration if needed');
}

runTests();
