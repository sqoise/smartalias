#!/bin/bash

# Semaph# Test phone number (replace with your actual test number)
TEST_PHONE="09998887777"  # Replace with your phone number in 09XXXXXXXXX format
TEST_MESSAGE="Hello from SmartLias! This is a test message from the barangay management system."MS API Test Script
# Based on official documentation: https://semaphore.co/docs

echo "🔧 Testing Semaphore SMS API..."
echo ""

# Load environment variables
source backend/.env

# Check if API key is set
if [ -z "$SEMAPHORE_API_KEY" ]; then
    echo "❌ Error: SEMAPHORE_API_KEY not found in .env file"
    exit 1
fi

echo "✅ API Key found: ${SEMAPHORE_API_KEY:0:8}..."
echo "📱 Sender Name: ${SEMAPHORE_SENDER_NAME:-'(default: SEMAPHORE)'}"
echo ""

# Test phone number (replace with your actual test number)
TEST_PHONE="09268939406"  # Replace with your phone number
TEST_MESSAGE="Announcement Ka-LIAS! Dumating napo ang ayuda para sa mga walang pera. Bumisita po sa ating barangay office upang kumuha ng ayuda. Maraming Salamat po.

"

echo "📞 Test Phone: $TEST_PHONE"
echo "💬 Test Message: $TEST_MESSAGE"
echo ""

# Build curl command based on whether sender name is set
if [ -n "$SEMAPHORE_SENDER_NAME" ]; then
    echo "🚀 Sending SMS with custom sender name..."
    curl -X POST "https://api.semaphore.co/api/v4/messages" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "apikey=$SEMAPHORE_API_KEY" \
         -d "number=$TEST_PHONE" \
         -d "message=$TEST_MESSAGE" \
         -d "sendername=$SEMAPHORE_SENDER_NAME" \
         -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n"
else
    echo "🚀 Sending SMS with default sender (SEMAPHORE)..."
    curl -X POST "https://api.semaphore.co/api/v4/messages" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "apikey=$SEMAPHORE_API_KEY" \
         -d "number=$TEST_PHONE" \
         -d "message=$TEST_MESSAGE" \
         -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n"
fi

echo ""
echo "🔍 Expected Response Format:"
echo "{"
echo "  \"message_id\": 12345,"
echo "  \"user_id\": 54321,"
echo "  \"user\": \"your@email.com\","
echo "  \"account_id\": 987654,"
echo "  \"account\": \"Your Account\","
echo "  \"recipient\": \"639998887777\","
echo "  \"message\": \"Your message...\","
echo "  \"sender_name\": \"SEMAPHORE\","
echo "  \"network\": \"Globe\","
echo "  \"status\": \"Pending\","
echo "  \"type\": \"Single\","
echo "  \"source\": \"Api\""
echo "}"
echo ""
echo "✅ If successful, you should receive an SMS on $TEST_PHONE"
echo "❌ If failed, check the error message above"
