# AI Chatbot PII Protection Guidelines

## 🔒 Current Protection Status: EXCELLENT ✅

The AI chatbot system has been designed with strong PII protection by default. No personal information from residents, users, or households is accessible to external AI providers.

## 📊 Tables Accessed by AI Chatbot

### ✅ SAFE TABLES (Public Information Only)
| Table | Purpose | PII Risk | Data Sent to AI |
|-------|---------|----------|-----------------|
| `faqs` | FAQ content | None | Questions and answers (public info) |
| `document_catalog` | Document fees | None | Document types and fees (public) |
| `announcements` | Public notices | None | Announcements and events (public) |
| `chat_messages` | Chat history | Low* | Previous Q&A context (sanitized) |
| `chat_conversations` | Session metadata | None | Session IDs and timestamps only |

*Chat messages contain user questions but no personal identifiers

### 🛡️ PROTECTED TABLES (Not Accessible to AI)
| Table | PII Content | Protection Status |
|-------|-------------|-------------------|
| `residents` | Names, addresses, birth dates, contact info | ✅ FULLY PROTECTED |
| `users` | Usernames, passwords, roles | ✅ FULLY PROTECTED |
| `households` | Household composition, member details | ✅ FULLY PROTECTED |
| `document_requests` | Request details, resident IDs | ✅ FULLY PROTECTED |

## 🔐 Enhanced Protection Measures

### 1. Chat Message Sanitization
```javascript
// Implement before sending to AI
static sanitizeChatMessage(message) {
  return message
    .replace(/\b\d{11}\b/g, '[PHONE_REDACTED]')           // Phone numbers
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL_REDACTED]') // Email addresses
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '[DATE_REDACTED]')  // Birth dates
    .replace(/\b(?:barangay|brgy\.?)\s+\w+/gi, '[ADDRESS_REDACTED]') // Addresses
}
```

### 2. Query Pattern Detection
```javascript
// Block queries requesting personal information
static detectPIIQuery(query) {
  const piiPatterns = [
    /\b(phone|contact|number|telepono)\b.*\b(resident|person|name)\b/i,
    /\b(address|tirahan|nakatira)\b.*\b(sino|who|resident)\b/i,
    /\b(birthday|birth date|kapanganakan)\b.*\b(resident|person)\b/i,
    /\b(list|listahan)\b.*\b(residents|mga residente)\b/i
  ]
  
  return piiPatterns.some(pattern => pattern.test(query))
}
```

### 3. AI Response Filtering
```javascript
// Filter AI responses to prevent accidental PII disclosure
static filterAIResponse(response) {
  // Remove any accidentally included personal data patterns
  return response
    .replace(/\b09\d{9}\b/g, '[CONTACT_INFO_REMOVED]')
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL_REMOVED]')
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '[DATE_REMOVED]')
}
```

## 📋 Implementation Checklist

### ✅ Currently Implemented
- [x] No direct access to PII tables
- [x] Only public information sent to AI
- [x] Context limited to FAQs and announcements
- [x] Chat history without personal identifiers

### 🔄 Recommended Enhancements
- [ ] Implement chat message sanitization
- [ ] Add PII query pattern detection
- [ ] Filter AI responses for accidental PII
- [ ] Add audit logging for AI interactions
- [ ] Implement data retention policies for chat logs

## 🚨 Emergency PII Breach Response

### If PII is Accidentally Exposed:
1. **Immediate Actions:**
   - Stop AI service immediately
   - Log the incident with full details
   - Identify affected user sessions
   - Document what data was exposed

2. **Investigation:**
   - Review chat logs for the incident
   - Check AI provider logs (if accessible)
   - Determine scope of exposure

3. **Remediation:**
   - Contact AI provider to request data deletion
   - Update protection measures
   - Notify affected residents if required
   - Update incident response procedures

## 📞 Contact Information
- **Data Protection Officer**: [Your DPO Contact]
- **IT Security Team**: [Your IT Contact]
- **Incident Response**: [Emergency Contact]

## 📅 Review Schedule
- **Monthly**: Review chat logs for PII patterns
- **Quarterly**: Update protection measures
- **Annually**: Full security audit of AI system

---
**Last Updated**: October 10, 2025  
**Next Review**: January 10, 2026  
**Document Owner**: IT Security Team
