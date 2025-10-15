# SmartLias Chatbot System - Implementation Guide

## 📋 Overview

The SmartLias Chatbot is an intelligent FAQ system that helps residents get instant answers to common questions about barangay services, document requests, and general inquiries.

## ✨ Features

### Core Functionality
- ✅ **Intelligent FAQ Matching** - Uses PostgreSQL full-text search for accurate results
- ✅ **Dynamic Responses** - Pulls data from database and lookup tables
- ✅ **Conversation History** - Tracks chat sessions and messages
- ✅ **Fallback Responses** - Provides helpful alternatives when no exact match found
- ✅ **Quick Suggestions** - Offers related questions for better navigation
- ✅ **Feedback System** - Users can rate FAQ helpfulness
- ✅ **Multi-category Support** - Organized by topics (Documents, Services, etc.)

### Data Sources
1. **FAQ Database** - Pre-populated questions and answers
2. **Document Catalog** - Dynamic list of available documents
3. **Special Categories** - PWD, Senior Citizen, Indigent programs
4. **Lookup Tables** - Purok, streets, and other reference data

## 🗄️ Database Schema

### Tables Created
1. **faq_categories** - Organizes FAQs by topic
2. **faqs** - Stores questions, answers, and keywords
3. **chat_conversations** - Tracks user sessions
4. **chat_messages** - Stores conversation history

## 🚀 Setup Instructions

### 1. Import Database Schema

Run the setup script:
```bash
chmod +x setup-chatbot.sh
./setup-chatbot.sh
```

Or manually:
```bash
psql -h localhost -p 5432 -U smartlias_user -d smartliasdb -f .local/db/chatbot-schema.sql
```

### 2. Add Chatbot to Your Pages

#### For Public Pages (Home, Login, etc.)
```jsx
import ChatbotButton from '@/components/common/ChatbotButton'

export default function HomePage() {
  return (
    <div>
      {/* Your page content */}
      
      {/* Add floating chatbot button */}
      <ChatbotButton />
    </div>
  )
}
```

#### For Authenticated Pages (Resident/Admin Dashboard)
```jsx
import ChatbotButton from '@/components/common/ChatbotButton'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Your dashboard content */}
      
      {/* Add floating chatbot button */}
      <ChatbotButton />
    </DashboardLayout>
  )
}
```

### 3. Test the Chatbot

1. Start the development servers:
   ```bash
   make dev
   ```

2. Open http://localhost:3000

3. Click the blue chatbot button in the bottom-right corner

4. Try these test questions:
   - "What documents can I request?"
   - "How do I request a barangay clearance?"
   - "What are the office hours?"
   - "How can I contact the barangay?"
   - "What is Certificate of Indigency?"

## 📡 API Endpoints

### Public Endpoints (No Auth Required)

#### Get FAQ Categories
```
GET /api/chatbot/categories
```

#### Get FAQs
```
GET /api/chatbot/faqs
GET /api/chatbot/faqs?categoryId=1
```

#### Get Specific FAQ
```
GET /api/chatbot/faqs/:id
```

#### Search FAQs
```
GET /api/chatbot/search?q=barangay clearance
```

#### Process Query (Main Chatbot Endpoint)
```
POST /api/chatbot/query
Body: {
  "query": "How do I request a document?",
  "sessionId": "session-12345"
}
```

#### Submit Feedback
```
POST /api/chatbot/faqs/:id/feedback
Body: {
  "helpful": true
}
```

#### Get Conversation History
```
GET /api/chatbot/conversations/:sessionId
```

## 💡 How It Works

### 1. User Asks Question
User types a question in the chatbot interface.

### 2. Query Processing
- Frontend sends query to `/api/chatbot/query` endpoint
- Backend searches FAQ database using full-text search
- Matches against question, answer, and keywords
- Ranks results by relevance

### 3. Response Generation

#### If Match Found
- Returns best matching FAQ answer
- Provides related questions as suggestions
- Increments view count

#### If No Match Found (Fallback)
- Analyzes query intent
- Provides dynamic data from lookup tables
- Suggests related FAQs

### 4. Conversation Tracking
- Each session gets unique ID
- Messages are stored in database
- Users can provide feedback

## 🎨 Customization

### Adding New FAQs

#### Via SQL
```sql
INSERT INTO faqs (category_id, question, answer, keywords, created_by) VALUES
(1, 'Your question here?', 
 'Your detailed answer here', 
 'keyword1, keyword2, keyword3',
 1);
```

#### Via Admin Panel (Future Enhancement)
Create an admin interface for FAQ management.

### Modifying Response Logic

Edit `/backend/controllers/chatbotController.js`:

```javascript
static async generateFallbackResponse(query) {
  // Add your custom logic here
  if (query.match(/your-pattern/)) {
    return {
      type: 'fallback',
      answer: 'Your custom response',
      suggestions: [...]
    }
  }
}
```

### Styling the Chatbot

Edit `/frontend/components/common/Chatbot.jsx` and modify Tailwind classes.

## 📊 Sample FAQs Included

### Documents Category (4 FAQs)
- What documents can I request?
- How do I request a barangay clearance?
- How long does it take to process documents?
- What are the requirements for Certificate of Indigency?

### Barangay Services (3 FAQs)
- What are the office hours?
- How can I contact barangay officials?
- What services does the barangay provide?

### Registration (2 FAQs)
- How do I register for an account?
- I forgot my PIN, how can I reset it?

### Announcements (2 FAQs)
- How can I view announcements?
- Why am I not receiving SMS notifications?

### General (1 FAQ)
- What is SmartLias?

## 🔍 Search Algorithm

The chatbot uses PostgreSQL full-text search with weighted ranking:

1. **Question match** (weight: 3x) - Highest priority
2. **Keywords match** (weight: 2x) - Medium priority  
3. **Answer match** (weight: 1x) - Lower priority
4. **Partial ILIKE match** - Fallback for flexibility

Results are ranked by:
- Relevance score (calculated from above weights)
- View count (popularity)

## 🚀 Advanced Features (Future Enhancements)

### 1. AI Integration
Integrate with OpenAI or similar for more intelligent responses:
```javascript
// Example with OpenAI
const openai = require('openai')
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: query }],
  context: faqContext
})
```

### 2. Admin Dashboard
Create FAQ management interface:
- Add/Edit/Delete FAQs
- View analytics (popular questions, feedback)
- Manage categories
- Export conversation logs

### 3. Multi-language Support
Add Tagalog translations:
```javascript
const faqs = {
  en: { question: "What documents...", answer: "..." },
  tl: { question: "Anong mga dokumento...", answer: "..." }
}
```

### 4. Voice Input
Add speech-to-text capability:
```javascript
const recognition = new webkitSpeechRecognition()
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript
  sendQuery(transcript)
}
```

### 5. Rich Media Responses
Include images, videos, or documents in responses.

## 📈 Analytics & Monitoring

### Track Important Metrics
- Most viewed FAQs
- Search queries with no results
- Helpful/Not helpful feedback ratio
- Peak usage times
- Common question patterns

### Query for Analytics
```sql
-- Most popular FAQs
SELECT question, view_count, helpful_count, not_helpful_count
FROM faqs
ORDER BY view_count DESC
LIMIT 10;

-- Low satisfaction FAQs
SELECT question, helpful_count, not_helpful_count,
       (not_helpful_count::float / NULLIF(helpful_count + not_helpful_count, 0)) as dissatisfaction_rate
FROM faqs
WHERE (helpful_count + not_helpful_count) > 5
ORDER BY dissatisfaction_rate DESC;
```

## 🐛 Troubleshooting

### Chatbot Not Responding
1. Check backend is running
2. Check database connection
3. Verify FAQ tables exist
4. Check browser console for errors

### No Search Results
1. Verify FAQs are marked as active (is_active = 1)
2. Check keywords are properly formatted
3. Test search directly in database
4. Review search algorithm in controller

### Database Connection Issues
1. Confirm PostgreSQL is running
2. Verify .env credentials
3. Check firewall/network settings

## 📝 Best Practices

### Writing Good FAQs

**DO:**
- Use clear, concise questions
- Provide detailed, accurate answers
- Include relevant keywords
- Format answers with bullet points/sections
- Update regularly based on user feedback

**DON'T:**
- Use jargon without explanation
- Write overly long answers
- Duplicate similar FAQs
- Leave outdated information

### Keywords
Include variations users might search:
```
"barangay clearance, clearance, brgy clearance, certificate, requirements, how to request"
```

## 🔒 Security Considerations

- Rate limiting applied to all chatbot endpoints
- SQL injection prevented by parameterized queries
- XSS protection via input sanitization
- Session IDs are randomly generated
- No sensitive data stored in chat logs

## 📞 Support

For issues or questions:
- Check documentation first
- Review error logs in backend/logs/
- Contact barangay IT team

---

**Version:** 1.0.0  
**Last Updated:** October 8, 2025  
**Maintained by:** Barangay Lias IT Team
