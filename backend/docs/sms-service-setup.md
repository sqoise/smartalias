# SMS Service Configuration Guide

## Overview
SmartLIAS now supports multiple SMS providers for sending notifications. The system is designed to be generic and easily configurable.

## Supported Providers

### 1. IProg SMS (Recommended for Philippines)
- **Endpoint**: `https://sms.iprogtech.com/api/v1/sms_messages/send_bulk`
- **Features**: Bulk SMS, Multiple SMS gateway providers
- **Configuration**:
  ```env
  SMS_PROVIDER=iprog
  IPROG_API_TOKEN=your-api-token-here
  IPROG_SMS_PROVIDER=0
  ```

**IPROG_SMS_PROVIDER Options:**
- **0**: Primary SMS gateway (default, usually more reliable)
- **1**: Secondary SMS gateway (alternative routing)

*This allows IProg to route your SMS through different telecom providers for better delivery rates and redundancy.*

### 2. Twilio (Future Implementation)
- **Status**: Planned for future releases
- **Configuration**: TBD

## Setup Instructions

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and update the SMS configuration:

```bash
# Choose your SMS provider
SMS_PROVIDER=iprog

# IProg SMS Configuration
IPROG_API_TOKEN=1231asd1
IPROG_SMS_PROVIDER=0
```

### 2. Restart the Backend Server

After updating environment variables:

```bash
cd backend
npm restart
```

### 3. Test SMS Functionality

Use the admin dashboard to send announcement SMS or test via API:

```bash
# Test SMS endpoint
curl -X POST http://localhost:9000/api/announcements/1/send-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"targetGroups": ["all"]}'
```

## API Specifications

### IProg SMS API

**Request Format:**
```json
{
  "api_token": "1231asd1",
  "phone_number": "09345678942,09345678923",
  "message": "Hello, this is a test message.",
  "sms_provider": 0
}
```

**sms_provider Parameter:**
- **0**: Use primary SMS gateway (recommended for most cases)
- **1**: Use secondary SMS gateway (fallback or specific routing needs)

*Different gateways may have different delivery rates, costs, or work better with specific telecom networks (Globe, Smart, Sun, etc.)*

**Response Format:**
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "sent_count": 2,
    "failed_count": 0
  }
}
```

### Phone Number Format

The system automatically normalizes phone numbers:
- **Input**: `639123456789` or `09123456789`
- **Output**: `09123456789` (Philippine format)

## Error Handling

The SMS service includes comprehensive error handling:

1. **API Token Validation**: Checks if tokens are configured
2. **Phone Number Validation**: Validates Philippine mobile numbers
3. **Provider Response Parsing**: Handles various response formats
4. **Retry Logic**: Automatic retries for failed requests
5. **Logging**: Detailed logs for debugging

## Monitoring

Check SMS sending status in the logs:

```bash
# View SMS logs
tail -f backend/logs/application.log | grep SMS

# Check for SMS errors
tail -f backend/logs/error.log | grep SMS
```

## Switching Providers
The system is configured to use IProg SMS API as the primary provider:

```bash
# IProg SMS API (Primary Provider)
SMS_PROVIDER=iprog
```

Restart the backend server for changes to take effect.

## Troubleshooting

### Common Issues

1. **"No SMS recipients found"**
   - Check if residents have valid mobile numbers
   - Verify residents are active in the database

2. **"API token not configured"**
   - Ensure environment variables are set correctly
   - Restart the backend server after changes

3. **"Invalid phone number format"**
   - Phone numbers should be 11 digits starting with 09
   - System auto-converts 639xxxxxxxxx format

### Debug Steps

1. Check environment configuration:
   ```bash
   node -e "console.log(require('./config/config.js').SMS_PROVIDER)"
   ```

2. Test phone number validation:
   ```bash
   # Run validation test
   npm run test:sms
   ```

3. Check resident data:
   ```sql
   SELECT mobile_number FROM residents WHERE is_active = 1;
   ```

## Support

For additional SMS provider integrations or issues:
- Create an issue in the project repository
- Check the application logs for detailed error information
- Verify API credentials with your SMS provider
