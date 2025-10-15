# PII Protection Best Practices - SmartLIAS Chatbot

## Problem: Ugly Redaction in AI Responses

**Bad Approach (Previous):**
```
User: "I'm Robert"
AI Response: "Hello, [NAME_REDACTED]! How can I help you?"
```

This looks unprofessional and breaks the user experience.

---

## Solution: Sanitize Input BEFORE Sending to AI

**Good Approach (Current):**
```
User types: "I'm Robert"
Backend sanitizes: "I'm [NAME_REDACTED]"
AI receives: "I'm [NAME_REDACTED]"
AI responds: "Hello! How can I help you today?"
User sees: "Hello! How can I help you today?" ✅ Natural and professional
```

---

## Implementation Details

### 1. **Sanitize User Query Before AI Processing**

**Location:** `backend/controllers/chatbotController.js`

```javascript
// BEFORE sending to AI
const sanitizedQuery = ChatbotController.sanitizeChatMessage(query.trim())

// AI never sees actual names, phone numbers, etc.
const aiAnswer = await aiService.generateAnswer(sanitizedQuery, aiContext)

// Use AI response directly - it's clean and natural
response = {
  type: 'ai',
  answer: aiAnswer, // No filtering needed
  ...
}
```

### 2. **What Gets Sanitized**

The `sanitizeChatMessage()` function removes:

- **Names**: "I'm Robert" → "I'm [NAME_REDACTED]"
- **Phone Numbers**: "Call me at 09171234567" → "Call me at [PHONE_REDACTED]"
- **Email Addresses**: "Email: john@example.com" → "Email: [EMAIL_REDACTED]"
- **Dates of Birth**: "Born on 05/15/1990" → "Born on [DATE_REDACTED]"
- **Addresses**: "123 Main Street" → "[ADDRESS_REDACTED]"
- **IDs**: "SSS 12-3456789-0" → "[SSS_REDACTED]"

### 3. **What's Preserved**

The sanitization function is smart and preserves:

- **Place Names**: SmartLIAS, Barangay, Lias, Marilao, Bulacan
- **Day Names**: Monday, Tuesday, Wednesday, etc.
- **Month Names**: January, February, March, etc.
- **Common Terms**: Office, Captain, Council, etc.

---

## Benefits of This Approach

### ✅ **1. Natural User Experience**
- No ugly `[NAME_REDACTED]` markers in chat
- AI responds naturally without awkward gaps
- Professional and friendly conversation flow

### ✅ **2. Better Privacy Protection**
- AI provider (Gemini, Groq, OpenAI) never sees user's real name
- PII never leaves your database
- Complies with Data Privacy Act (RA 10173)

### ✅ **3. Consistent Protection**
- Same sanitization applied to both user messages and AI context
- Database stores only sanitized versions
- No risk of PII leaking through AI responses

### ✅ **4. Maintainable Code**
- Single sanitization function handles all PII
- No need to filter AI responses separately
- Clear separation: sanitize input → process → store

---

## Database Storage

Both user messages and AI responses are stored with appropriate protection:

```javascript
// User message: ALWAYS sanitized before storage
await ChatbotRepository.saveMessage(conversation.id, {
  message: sanitizedUserMessage,  // Protected
  response: response.answer,       // Clean AI response
  source: response.source
})
```

**Example in Database:**
```sql
-- chat_messages table
id | conversation_id | message              | response                           | is_from_user
---+------------------+----------------------+------------------------------------+-------------
1  | 123              | I'm [NAME_REDACTED]  | Hello! How can I help you today?   | true
```

---

## Testing the Protection

### Test Case 1: Name Introduction
```
User: "I'm Robert"
Database: "I'm [NAME_REDACTED]"
AI sees: "I'm [NAME_REDACTED]"
AI responds: "Hello! How can I help you today?"
```

### Test Case 2: Greeting with Name
```
User: "Hi, I'm Sarah and I need help"
Database: "Hi, I'm [NAME_REDACTED] and I need help"
AI sees: "Hi, I'm [NAME_REDACTED] and I need help"
AI responds: "Hello! I'd be happy to help you. What do you need assistance with?"
```

### Test Case 3: Contact Information
```
User: "My number is 09171234567"
Database: "My number is [PHONE_REDACTED]"
AI sees: "My number is [PHONE_REDACTED]"
AI responds: "Thank you. How can I assist you today?"
```

### Test Case 4: Office Information (Should NOT be redacted)
```
User: "What's the barangay office schedule?"
Database: "What's the barangay office schedule?"
AI sees: "What's the barangay office schedule?"
AI responds: "The Barangay office is open Monday to Friday, 8:00 AM to 5:00 PM..."
```

---

## Verification Queries

Check if PII protection is working:

```sql
-- 1. Check recent messages for redaction markers
SELECT 
  message,
  response,
  created_at
FROM chat_messages 
WHERE is_from_user = true
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Look for unredacted phone numbers (should be empty)
SELECT * FROM chat_messages 
WHERE message ~ '\b09\d{9}\b' 
  AND is_from_user = true;

-- 3. Look for unredacted emails (should be empty)
SELECT * FROM chat_messages 
WHERE message ~ '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
  AND is_from_user = true;

-- 4. Count redacted vs non-redacted messages
SELECT 
  CASE 
    WHEN message LIKE '%[%_REDACTED]%' THEN 'Protected'
    ELSE 'Clean'
  END as status,
  COUNT(*) as count
FROM chat_messages 
WHERE is_from_user = true
GROUP BY status;
```

---

## Compliance & Privacy

This approach ensures compliance with:

- **Data Privacy Act (RA 10173)**: Minimizes PII collection and storage
- **General Data Protection Regulation (GDPR)**: Data minimization principle
- **AI Provider Terms**: User PII never shared with third-party AI services
- **Government Standards**: Protects citizen data in barangay systems

---

## Key Takeaway

**Always sanitize input BEFORE processing, not after output generation.**

This is the industry-standard approach for:
- Search engines (Google doesn't show your search history to everyone)
- AI chatbots (ChatGPT doesn't echo your personal info)
- Customer service systems (Zendesk redacts PII before analysis)

**Result:** Professional, natural user experience with strong privacy protection.

---

**Last Updated:** October 15, 2025  
**Implementation Status:** ✅ COMPLETED  
**Testing Status:** Ready for testing
