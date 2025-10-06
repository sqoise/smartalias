# SMS Notification System - Setup Guide

## Overview

SmartLias includes an SMS notification system that sends announcements to residents when published. The system uses **Semaphore** (Philippine SMS provider) for sending messages.

## Features

- ✅ **Targeted SMS Sending**: Send to specific groups (PWD, Senior Citizens, Solo Parents, Indigent, or All Residents)
- ✅ **Phone Number Validation**: Validates Philippine mobile numbers (09xxxxxxxxx format)
- ✅ **SMS Logging**: All sent messages are logged to database with delivery status
- ✅ **Development Mode**: SMS simulation in development (no API key required)
- ✅ **Background Processing**: SMS sending doesn't block API responses
- ✅ **Error Handling**: Comprehensive error tracking and logging

---

## Setup Instructions

### 1. **Get Semaphore API Key**

1. Visit [https://semaphore.co/](https://semaphore.co/)
2. Create an account or login
3. Navigate to **API Settings**
4. Copy your **API Key**

### 2. **Configure Environment Variables**

Add these to your `.env` file:

```env
# SMS Configuration
SEMAPHORE_API_KEY=your-actual-api-key-here
SEMAPHORE_SENDER_NAME=BARANGAY
```

### 3. **Database Setup** (Already configured)

The system uses these database tables:
- `residents` - Contains mobile_number field
- `sms_notifications` - Logs all SMS activity
- `special_categories` - Maps target groups

### 4. **Test SMS Sending**

#### Development Mode (No API Key):
- SMS will be **simulated** and logged to console
- No actual messages sent
- Perfect for testing functionality

#### Production Mode (With API Key):
- Real SMS messages sent via Semaphore
- Charges apply per message
- Recipients receive actual SMS

---

## Usage

### Publishing Announcements with SMS

1. **Create/Edit Announcement**
2. **Select SMS Target Groups**:
   - ☑️ Send SMS to PWD
   - ☑️ Send SMS to Senior Citizens
   - ☑️ Send SMS to Solo Parents
   - ☑️ Send SMS to Indigent Families
   - ☑️ Send SMS to All Residents
3. **Click "Publish Now"**
4. System will:
   - Retrieve residents matching target groups
   - Filter only those with valid mobile numbers
   - Send SMS to each recipient
   - Log delivery status to database

---

## SMS Message Format

```
[BARANGAY ANNOUNCEMENT]
{Title}

{Content (truncated to 160 chars)}

- Barangay Office
```

**Example**:
```
[BARANGAY ANNOUNCEMENT]
Community Clean-up Drive

Join us this Saturday at 7AM for our monthly clean-up. All residents are invited...

- Barangay Office
```

---

## Phone Number Format

The system accepts Philippine mobile numbers in these formats:

- `09xxxxxxxxx` (11 digits) ✅
- `+639xxxxxxxxx` (13 digits) ✅
- `639xxxxxxxxx` (12 digits) ✅

All formats are automatically normalized to `09xxxxxxxxx` before sending.

---

## Monitoring & Logs

### Application Logs

Check `backend/logs/application.log` for SMS activity:

```bash
# View SMS logs
tail -f backend/logs/application.log | grep SMS
```

Example log entries:
```
INFO: SMS recipients retrieved { announcementId: 1, recipientCount: 45, targetGroups: ['all'] }
INFO: SMS notifications sent { announcementId: 1, total: 45, sent: 43, failed: 2 }
```

### Database Logs

Query `sms_notifications` table:

```sql
-- Recent SMS activity
SELECT 
  sn.*,
  a.title as announcement_title,
  r.first_name || ' ' || r.last_name as resident_name
FROM sms_notifications sn
LEFT JOIN announcements a ON sn.announcement_id = a.id
LEFT JOIN residents r ON sn.resident_id = r.id
ORDER BY sn.sent_at DESC
LIMIT 50;

-- SMS delivery statistics
SELECT 
  delivery_status,
  COUNT(*) as count
FROM sms_notifications
GROUP BY delivery_status;
```

---

## Cost Considerations

### Semaphore Pricing (as of 2025):
- ₱0.70 - ₱1.00 per SMS (depending on plan)
- Bulk sending discounts available
- Pre-paid credits system

### Cost Calculation:
```
Example: 100 residents × ₱0.80/SMS = ₱80.00 per announcement
```

**Recommendations**:
1. Use targeted groups to reduce costs
2. Avoid sending announcements too frequently
3. Monitor your Semaphore credit balance
4. Consider SMS for urgent announcements only

---

## Troubleshooting

### Issue: "Semaphore API key not configured"

**Solution**: Add `SEMAPHORE_API_KEY` to `.env` file

### Issue: No SMS received by residents

**Checklist**:
1. ✅ Is `SEMAPHORE_API_KEY` valid?
2. ✅ Do residents have mobile numbers in database?
3. ✅ Are mobile numbers in valid format (09xxxxxxxxx)?
4. ✅ Is Semaphore account funded?
5. ✅ Check `sms_notifications` table for delivery_status

### Issue: Some SMS failed to send

**Check**:
```sql
-- View failed SMS
SELECT * FROM sms_notifications 
WHERE delivery_status = 'failed'
ORDER BY sent_at DESC;
```

Common reasons:
- Invalid phone number format
- Insufficient Semaphore credits
- Network issues
- Phone number inactive/disconnected

---

## Security Notes

1. **Never commit API keys** to git repository
2. **Use .env file** for configuration (git ignored)
3. **Rotate API keys** periodically
4. **Monitor SMS logs** for unusual activity
5. **Implement rate limiting** for SMS-heavy operations

---

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| SMS Sending | Simulated | Real |
| API Key Required | No | Yes |
| Costs | Free | Paid per SMS |
| Logging | Console + DB | DB only |
| Testing | Safe | Use carefully |

---

## API Endpoints

### Create Announcement with SMS
```http
POST /api/announcements
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Emergency Alert",
  "content": "Typhoon warning...",
  "status": "published",
  "sms_target_groups": ["all"]
}
```

### Update and Publish with SMS
```http
PUT /api/announcements/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated: Emergency Alert",
  "content": "Typhoon now Signal #3...",
  "status": "published",
  "sms_target_groups": ["special_category:SENIOR_CITIZEN"]
}
```

---

## Support

For Semaphore API support:
- Website: https://semaphore.co/
- Email: support@semaphore.co
- Documentation: https://semaphore.co/docs

For SmartLias SMS system issues:
- Check application logs: `backend/logs/application.log`
- Review database logs: `sms_notifications` table
- Enable debug logging if needed

---

## Future Enhancements

Planned features:
- [ ] SMS templates with variables
- [ ] Scheduled SMS sending
- [ ] SMS delivery reports
- [ ] Multiple SMS provider support (Twilio, Nexmo)
- [ ] SMS reply handling
- [ ] SMS opt-out management
- [ ] SMS analytics dashboard

---

**Last Updated**: January 2025  
**Version**: 1.0
