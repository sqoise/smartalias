#!/usr/bin/env node

/**
 * Test Registration Script
 * Tests the registration endpoint with controlled data to debug validation issues
 */

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')

// Test configuration
const API_BASE_URL = 'http://localhost:9000/api'
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg')

// Create a simple test image file if it doesn't exist
async function createTestImage() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // Create a minimal valid JPEG file (1x1 pixel)
    const minimalJPEG = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x00, 0xFF, 0xD9
    ])
    
    fs.writeFileSync(TEST_IMAGE_PATH, minimalJPEG)
    console.log(`✓ Created test image: ${TEST_IMAGE_PATH}`)
  }
}

// Test data that should pass all validation
const TEST_REGISTRATION_DATA = {
  // Account credentials
  username: 'test.user123',
  pin: '123456',
  
  // Personal Information (Step 1)
  firstName: 'Juan',
  middleName: 'Cruz',
  lastName: 'Dela Rosa',
  suffix: '1', // Jr = 1
  
  // Personal Details (Step 2)
  birthDate: '1990-05-15',
  gender: '1', // Male = 1
  civilStatus: 'Single',
  
  // Contact Information (Step 2)
  homeNumber: '83334444',
  mobileNumber: '09123456789',
  email: 'test@example.com',
  address: '123 Main Street Barangay Lias, Marilao, Bulacan Philippines',
  purok: '3',
  
  // Additional Information (Step 3)
  religion: 'ROMAN_CATHOLIC',
  occupation: 'EMPLOYED',
  specialCategory: '1' // Will be converted to ID if needed
}

async function testRegistration() {
  console.log('🧪 Testing Registration Endpoint')
  console.log('================================\n')
  
  try {
    // Create test image
    await createTestImage()
    
    // Step 1: Test username availability
    console.log('1️⃣ Testing username availability...')
    const usernameCheck = await fetch(`${API_BASE_URL}/auth/check-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: TEST_REGISTRATION_DATA.username })
    })
    
    const usernameResult = await usernameCheck.json()
    console.log(`   Status: ${usernameCheck.status}`)
    console.log(`   Response:`, usernameResult)
    
    if (usernameCheck.status === 200) {
      console.log('   ⚠️  Username already exists! Using different username...')
      TEST_REGISTRATION_DATA.username = `test.user${Date.now()}`
      console.log(`   New username: ${TEST_REGISTRATION_DATA.username}`)
    } else if (usernameCheck.status === 404) {
      console.log('   ✅ Username available!')
    }
    
    // Step 2: Test registration with FormData
    console.log('\n2️⃣ Testing registration...')
    const formData = new FormData()
    
    // Add all fields to FormData
    Object.entries(TEST_REGISTRATION_DATA).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString())
      }
    })
    
    // Add test document image
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH)
    formData.append('documentImage', imageBuffer, {
      filename: 'test-document.jpg',
      contentType: 'image/jpeg'
    })
    
    console.log('   📋 Sending registration data:')
    console.log('   Form fields:', Object.keys(TEST_REGISTRATION_DATA))
    console.log('   Has document:', 'Yes (test-document.jpg)')
    
    const registrationResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: formData
    })
    
    const registrationResult = await registrationResponse.json()
    
    console.log(`\n   📊 Registration Result:`)
    console.log(`   Status: ${registrationResponse.status}`)
    console.log(`   Success: ${registrationResult.success || false}`)
    console.log(`   Message: ${registrationResult.message || registrationResult.error || 'No message'}`)
    
    if (registrationResult.errors) {
      console.log(`   🚨 Validation Errors:`)
      if (Array.isArray(registrationResult.errors)) {
        registrationResult.errors.forEach((error, index) => {
          console.log(`      ${index + 1}. ${error}`)
        })
      } else {
        console.log('   ', registrationResult.errors)
      }
    }
    
    if (registrationResult.data) {
      console.log(`   📋 Response Data:`)
      console.log('   ', registrationResult.data)
    }
    
    // Step 3: Check server logs for more details
    console.log('\n3️⃣ Check backend console/logs for detailed validation info')
    
    // Cleanup test image
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      fs.unlinkSync(TEST_IMAGE_PATH)
      console.log('   🗑️  Cleaned up test image')
    }
    
    return {
      success: registrationResponse.status === 200 || registrationResponse.status === 201,
      status: registrationResponse.status,
      result: registrationResult
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Alternative test with minimal required data only
async function testMinimalRegistration() {
  console.log('\n🧪 Testing Minimal Registration (Required Fields Only)')
  console.log('====================================================\n')
  
  const minimalData = {
    username: `minimal.user${Date.now()}`,
    pin: '654321',
    firstName: 'Test',
    lastName: 'User',
    birthDate: '1995-01-01',
    gender: '1',
    civilStatus: 'Single',
    address: 'Test Address 123 Main Street Barangay Test Location Philippines',
    purok: '1',
    mobileNumber: '09987654321',
    religion: 'ROMAN_CATHOLIC',
    occupation: 'EMPLOYED'
  }
  
  try {
    await createTestImage()
    
    const formData = new FormData()
    Object.entries(minimalData).forEach(([key, value]) => {
      formData.append(key, value.toString())
    })
    
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH)
    formData.append('documentImage', imageBuffer, {
      filename: 'minimal-test.jpg',
      contentType: 'image/jpeg'
    })
    
    console.log('📋 Minimal registration data:', minimalData)
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    console.log(`\n📊 Result:`)
    console.log(`Status: ${response.status}`)
    console.log(`Response:`, result)
    
    // Cleanup
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      fs.unlinkSync(TEST_IMAGE_PATH)
    }
    
    return { success: response.status < 400, status: response.status, result }
    
  } catch (error) {
    console.error('❌ Minimal test failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Main execution
async function main() {
  console.log('🚀 SmartLias Registration Test Suite')
  console.log('===================================\n')
  
  // Test 1: Full registration
  const fullTest = await testRegistration()
  
  // Test 2: Minimal registration (if full test fails)
  if (!fullTest.success) {
    console.log('\n🔄 Full test failed, trying minimal registration...')
    const minimalTest = await testMinimalRegistration()
    
    if (minimalTest.success) {
      console.log('\n✅ Minimal registration succeeded! Issue is with optional fields.')
    } else {
      console.log('\n❌ Even minimal registration failed! Issue is with required fields.')
    }
  } else {
    console.log('\n✅ Registration test completed successfully!')
  }
  
  console.log('\n📝 Next Steps:')
  console.log('1. Check backend console output for detailed validation logs')
  console.log('2. Check backend/logs/application.log for structured logs')
  console.log('3. Compare test data with frontend form data')
  console.log('4. Verify database connection and table structure')
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
}

module.exports = {
  testRegistration,
  testMinimalRegistration,
  TEST_REGISTRATION_DATA
}
