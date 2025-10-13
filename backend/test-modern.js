const modernDocxService = require('./services/modernDocxService');
const fs = require('fs');
const fetch = require('node-fetch');

// Test 1: Direct service test
async function testDirectService() {
  try {
    console.log('========================================');
    console.log('TEST 1: Direct DOCX Service Test');
    console.log('========================================');
    
    const testData = {
      documentId: 'TEST-001',
      residentName: 'Juan Pedro Dela Cruz',
      address: 'Block 5 Lot 3, Lias, Marilao, Bulacan',
      purpose: 'Electrical installation for residential building',
      documentType: 'electrical_permit'
    };
    
    console.log('Test data:', testData);
    
    // Generate DOCX using direct service
    const docxBuffer = await modernDocxService.generateDocument('electrical_permit', testData);
    
    console.log('DOCX generated successfully!');
    console.log('Buffer size:', docxBuffer.length, 'bytes');
    console.log('Buffer is Buffer?', Buffer.isBuffer(docxBuffer));
    console.log('First 4 bytes (should be PK signature):', docxBuffer.slice(0, 4).toString('hex'));
    
    // Check PK ZIP signature (DOCX files are ZIP archives)
    const isPKSignature = docxBuffer[0] === 0x50 && docxBuffer[1] === 0x4B;
    console.log('Valid DOCX signature (PK)?', isPKSignature);
    
    if (!isPKSignature) {
      console.error('INVALID DOCX - Missing PK ZIP signature!');
      return false;
    }
    
    // Save the test file
    fs.writeFileSync('./test_direct_service.docx', docxBuffer);
    console.log('File saved as: test_direct_service.docx');
    console.log('TEST 1: PASSED ✓');
    console.log('');
    
    return true;
    
  } catch (error) {
    console.error('TEST 1: FAILED ✗');
    console.error('Error:', error.message);
    return false;
  }
}

// Test 2: HTTP endpoint test (simulating frontend request)
async function testHTTPEndpoint() {
  try {
    console.log('========================================');
    console.log('TEST 2: HTTP Endpoint Test');
    console.log('========================================');
    console.log('Simulating frontend fetch request...');
    
    console.log('Note: Make sure backend server is running on http://localhost:9000');
    console.log('');
    
    // First, login to get token
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await fetch('http://localhost:9000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin.kapitan',
        pin: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.error(errorText);
      console.log('TEST 2: FAILED ✗ (login failed)');
      return false;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.success || !loginData.data || !loginData.data.token) {
      console.error('Login response missing token');
      console.log('TEST 2: FAILED ✗ (no token in response)');
      return false;
    }
    
    const token = loginData.data.token;
    console.log('Login successful! Token received.');
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('');
    
    // Now test document generation
    console.log('Step 2: Requesting document generation...');
    
    const testData = {
      documentId: 'TEST-HTTP-001',
      documentType: 'electrical_permit',
      residentName: 'Maria Santos Reyes',
      address: 'Block 8 Lot 12, Lias, Marilao, Bulacan',
      purpose: 'Electrical wiring installation',
      requestDate: new Date().toISOString()
    };
    
    const response = await fetch('http://localhost:9000/api/documents/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:');
    console.log('  Content-Type:', response.headers.get('content-type'));
    console.log('  Content-Disposition:', response.headers.get('content-disposition'));
    console.log('  Content-Length:', response.headers.get('content-length'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error:', errorText);
      console.log('TEST 2: FAILED ✗');
      return false;
    }
    
    // Get response as buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log('');
    console.log('Response received:');
    console.log('  Buffer size:', buffer.length, 'bytes');
    console.log('  Is Buffer?', Buffer.isBuffer(buffer));
    console.log('  First 4 bytes (hex):', buffer.slice(0, 4).toString('hex'));
    console.log('  First 4 bytes (dec):', Array.from(buffer.slice(0, 4)));
    console.log('  First 10 bytes as string:', buffer.slice(0, 10).toString());
    
    // Check if response is JSON (error case)
    if (buffer[0] === 0x7B) { // '{' character
      const jsonResponse = JSON.parse(buffer.toString());
      console.error('Received JSON instead of binary:');
      console.error(jsonResponse);
      console.log('TEST 2: FAILED ✗');
      return false;
    }
    
    // Check PK ZIP signature
    const isPKSignature = buffer[0] === 0x50 && buffer[1] === 0x4B;
    console.log('  Valid DOCX signature (PK)?', isPKSignature);
    
    if (!isPKSignature) {
      console.error('INVALID DOCX - Missing PK ZIP signature!');
      console.error('First 100 bytes:', buffer.slice(0, 100).toString());
      console.log('TEST 2: FAILED ✗');
      return false;
    }
    
    // Save the file
    fs.writeFileSync('./test_http_endpoint.docx', buffer);
    console.log('');
    console.log('File saved as: test_http_endpoint.docx');
    console.log('TEST 2: PASSED ✓');
    console.log('');
    
    return true;
    
  } catch (error) {
    console.error('TEST 2: FAILED ✗');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  DOCX Generation Test Suite          ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  
  const test1 = await testDirectService();
  const test2 = await testHTTPEndpoint();
  
  console.log('');
  console.log('========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log('Test 1 (Direct Service):', test1 ? 'PASSED ✓' : 'FAILED ✗');
  console.log('Test 2 (HTTP Endpoint):', test2 ? 'PASSED ✓' : 'SKIPPED/FAILED');
  console.log('========================================');
  console.log('');
  
  if (test1 && !test2) {
    console.log('💡 Test 1 passed but Test 2 failed/skipped:');
    console.log('   - The DOCX service itself works correctly');
    console.log('   - Issue might be in HTTP response handling');
    console.log('   - Set TEST_TOKEN env var to run HTTP test');
  }
}

runTests();
