/**
 * Test DOCX Generation Manually
 * This script tests the document generation outside of the API context
 */

const path = require('path');
const fs = require('fs');
const modernDocxService = require('./services/modernDocxService');

// Test data - similar to what the API receives
const testDocumentRequest = {
  documentId: 'REQ-2025-0001',
  documentType: 'barangay_clearance',
  residentName: 'Juan Dela Cruz',
  address: 'Sample Street, Barangay Test',
  purpose: 'Testing document generation',
  requestDate: new Date().toISOString()
};

console.log('🧪 Testing DOCX Generation...\n');
console.log('Test Data:', JSON.stringify(testDocumentRequest, null, 2));
console.log('\n' + '='.repeat(60) + '\n');

async function testDocxGeneration() {
  try {
    console.log('📝 Step 1: Checking template file...');
    const templatePath = path.join(__dirname, 'templates', 'barangay_clearance_template.docx');
    
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template file not found:', templatePath);
      return;
    }
    
    const templateStats = fs.statSync(templatePath);
    console.log('✅ Template found:', templatePath);
    console.log('   Template size:', templateStats.size, 'bytes');
    console.log('');
    
    console.log('📝 Step 2: Generating document...');
    const result = await modernDocxService.generateDocument(
      testDocumentRequest.documentType,
      {
        residentName: testDocumentRequest.residentName,
        address: testDocumentRequest.address,
        purpose: testDocumentRequest.purpose,
        requestDate: testDocumentRequest.requestDate,
        documentId: testDocumentRequest.documentId
      }
    );
    
    console.log('✅ Document generated successfully!');
    console.log('   Buffer type:', Buffer.isBuffer(result.buffer));
    console.log('   Buffer size:', result.buffer.length, 'bytes');
    console.log('   Filename:', result.filename);
    console.log('');
    
    // Check if it looks like a valid DOCX (should start with PK - ZIP signature)
    const firstBytes = result.buffer.slice(0, 4);
    const isPKZip = firstBytes[0] === 0x50 && firstBytes[1] === 0x4B;
    
    console.log('📝 Step 3: Validating DOCX format...');
    console.log('   First 4 bytes:', Array.from(firstBytes).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' '));
    console.log('   Is valid ZIP/DOCX?', isPKZip ? '✅ YES' : '❌ NO');
    
    if (!isPKZip) {
      console.error('\n❌ ERROR: Generated file is not a valid DOCX!');
      console.log('First 100 bytes as string:', result.buffer.slice(0, 100).toString('utf8'));
      return;
    }
    
    console.log('');
    console.log('📝 Step 4: Saving test file...');
    const outputPath = path.join(__dirname, 'test-output.docx');
    fs.writeFileSync(outputPath, result.buffer);
    console.log('✅ Test file saved:', outputPath);
    console.log('');
    
    console.log('✅ TEST PASSED! Try opening the file:', outputPath);
    
  } catch (error) {
    console.error('❌ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDocxGeneration().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('Test completed');
}).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
