# 🚀 SmartLias Chatbot - Visual Architecture Guide

## 📊 Three-Tier Hybrid Search Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ASKS QUESTION                        │
│              "How do I request a barangay clearance?"            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TIER 1: PostgreSQL Full-Text Search              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Speed: 50-200ms                                    Coverage: 90% │
│ Cost: FREE                                                       │
│                                                                  │
│ SELECT * FROM faqs                                               │
│ WHERE search_vector @@ plainto_tsquery('english', $query)        │
│                                                                  │
│ ✅ MATCH FOUND?                                                  │
│    └─> Return with badge: 📚 FAQ Database                       │
│                                                                  │
│ ❌ NO MATCH?                                                     │
│    └─> Continue to Tier 2...                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TIER 2: Fuse.js Fuzzy Search                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Speed: 100-300ms                                   Coverage: 5%  │
│ Cost: FREE                                                       │
│                                                                  │
│ fuse.search(query, {                                             │
│   threshold: 0.4,        // 60% similarity required             │
│   keys: ['question', 'answer', 'keywords']                       │
│ })                                                               │
│                                                                  │
│ ✅ MATCH FOUND? (score >= 0.4)                                  │
│    └─> Return with badge: 📚 FAQ Database                       │
│                                                                  │
│ ❌ NO MATCH?                                                     │
│    └─> Continue to Tier 3...                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              TIER 3: Google Gemini AI Generation                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Speed: 500-1500ms                                  Coverage: 5%  │
│ Cost: FREE (1,500/day limit)                                     │
│                                                                  │
│ if (geminiService.isAvailable()) {                               │
│   const answer = await geminiService.generateAnswer(             │
│     query,                                                       │
│     contextFAQs.slice(0, 2)  // Only top 2 FAQs                 │
│   );                                                             │
│                                                                  │
│   ✅ GENERATED?                                                  │
│      └─> Return with badges:                                    │
│          🤖 AI Generated                                         │
│          ⚠️  "This answer was AI-generated..."                  │
│ }                                                                │
│                                                                  │
│ ❌ AI UNAVAILABLE/ERROR?                                         │
│    └─> Continue to Fallback...                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FALLBACK: Static Response                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Speed: 1ms                                         Coverage: 0%  │
│ Cost: FREE                                                       │
│                                                                  │
│ return {                                                         │
│   answer: "I don't have specific information...",               │
│   badge: ℹ️ General Info                                        │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend UI States

### State 1: Rule-Based Answer (PostgreSQL/Fuse.js)
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 SmartLias Assistant                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ You                                             10:30 │   │
│ │ How do I request a barangay clearance?              │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ SmartLias                                       10:30 │   │
│ │                                                       │   │
│ │ To request a Barangay Clearance, follow these steps: │   │
│ │ 1. Visit the barangay office during office hours     │   │
│ │ 2. Bring valid ID and proof of residency             │   │
│ │ 3. Fill out the application form                     │   │
│ │ 4. Pay the processing fee (₱50)                      │   │
│ │ 5. Wait 3-5 business days for processing             │   │
│ │                                                       │   │
│ │ ┌───────────────────────────┐ ┌─────────┐            │   │
│ │ │ 📚 FAQ Database           │ │ 120ms   │            │   │
│ │ └───────────────────────────┘ └─────────┘            │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### State 2: AI-Generated Answer (Gemini)
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 SmartLias Assistant                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ You                                             10:35 │   │
│ │ My grandmother is sick and can't walk. How can the   │   │
│ │ barangay help with transportation to the hospital?   │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ SmartLias                                       10:35 │   │
│ │                                                       │   │
│ │ The barangay offers several assistance programs:     │   │
│ │                                                       │   │
│ │ 1. **Emergency Transport**: Contact the barangay     │   │
│ │    health center for ambulance services              │   │
│ │                                                       │   │
│ │ 2. **Medical Assistance**: Apply for medical         │   │
│ │    assistance through the barangay social welfare    │   │
│ │                                                       │   │
│ │ 3. **Senior Citizen Support**: Your grandmother may  │   │
│ │    qualify for senior citizen benefits               │   │
│ │                                                       │   │
│ │ Please visit the office for immediate help.          │   │
│ │                                                       │   │
│ │ ┌────────────────────────────┐ ┌─────────┐           │   │
│ │ │ 🤖 AI Generated            │ │ 1,200ms │           │   │
│ │ └────────────────────────────┘ └─────────┘           │   │
│ │                                                       │   │
│ │ ┌───────────────────────────────────────────────┐    │   │
│ │ │ ⚠️  AI-Generated Answer                       │    │   │
│ │ │ This answer was generated by AI. Please       │    │   │
│ │ │ verify with the barangay office.              │    │   │
│ │ └───────────────────────────────────────────────┘    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### State 3: Static Fallback
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 SmartLias Assistant                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ You                                             10:40 │   │
│ │ xyz random nonsense query                             │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ SmartLias                                       10:40 │   │
│ │                                                       │   │
│ │ I don't have specific information about that.        │   │
│ │ Please try rephrasing your question or contact       │   │
│ │ the barangay office directly.                         │   │
│ │                                                       │   │
│ │ ┌────────────────────────────┐ ┌─────────┐           │   │
│ │ │ ℹ️  General Info            │ │ 5ms     │           │   │
│ │ └────────────────────────────┘ └─────────┘           │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Source Tracking Data Flow

### Backend Response Object
```javascript
{
  "success": true,
  "data": {
    "answer": "To request a Barangay Clearance...",
    
    // Source Tracking
    "source": "database",           // Options: database | fuzzy-search | gemini-ai | fallback
    "method": "postgresql",         // Options: postgresql | fusejs | google-gemini | static-fallback
    "aiGenerated": false,           // true only for Gemini responses
    "responseTime": 120,            // milliseconds
    "disclaimer": null,             // Only for AI: "This answer was AI-generated..."
    
    // Metadata
    "metadata": {
      "searchMethod": "rule-based", // Options: rule-based | ai-powered
      "engine": "postgresql-fulltext", // Full engine name
      "cached": false,              // Future: cache support
      "reason": null                // Only for fallback: "quota-exceeded" | "ai-error" | "ai-disabled"
    }
  }
}
```

### Frontend Badge Rendering Logic
```javascript
// Chatbot.jsx - Lines 193-228

// Determine badge type from metadata
const getBadgeInfo = (metadata) => {
  if (metadata.searchMethod === 'rule-based') {
    return {
      icon: '📚',
      text: 'FAQ Database',
      className: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  }
  
  if (metadata.searchMethod === 'ai-powered') {
    return {
      icon: '🤖',
      text: 'AI Generated',
      className: 'bg-purple-50 text-purple-700 border-purple-200'
    };
  }
  
  return {
    icon: 'ℹ️',
    text: 'General Info',
    className: 'bg-gray-50 text-gray-600 border-gray-200'
  };
};

// Render badge
<span className={`px-2 py-1 text-xs rounded border ${badgeInfo.className}`}>
  {badgeInfo.icon} {badgeInfo.text}
</span>

// Show AI disclaimer if needed
{message.aiGenerated && (
  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
    ⚠️ {message.disclaimer}
  </div>
)}

// Show response time
<span className="text-xs text-gray-500">
  {message.responseTime}ms
</span>
```

---

## 📈 Performance Characteristics

### Response Time Distribution
```
PostgreSQL Search:        ▓▓▓░░░░░░░░░░░░░░░░░  50-200ms    (90% of queries)
Fuse.js Fuzzy Search:     ▓▓▓▓▓▓░░░░░░░░░░░░░░  100-300ms   (5% of queries)
Google Gemini AI:         ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  500-1500ms  (5% of queries)
Static Fallback:          ▓░░░░░░░░░░░░░░░░░░░  1-5ms       (<1% of queries)

Average Response Time: ~180ms
```

### Query Distribution (Expected)
```
Daily Total: 500 queries

PostgreSQL:    450 queries ████████████████████████████████████  90%
Fuse.js:        25 queries ██                                     5%
Gemini AI:      25 queries ██                                     5%
Fallback:        0 queries                                        0%

Monthly AI Usage: 750 / 45,000 free queries (1.7%)
```

### Cost Analysis
```
Tier           | Cost per Query | Daily Queries | Daily Cost | Monthly Cost
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PostgreSQL     | $0.00          | 450           | $0.00      | $0.00
Fuse.js        | $0.00          | 25            | $0.00      | $0.00
Gemini (Free)  | $0.00          | 25            | $0.00      | $0.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                                                            $0.00/month
```

---

## 🔧 Configuration Matrix

### Environment Variables
```bash
# backend/.env

# Option 1: AI Enabled (Recommended)
GEMINI_ENABLED=true
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
# Result: All 3 tiers active (PostgreSQL → Fuse.js → Gemini AI)

# Option 2: AI Disabled (Rule-Based Only)
GEMINI_ENABLED=false
GEMINI_API_KEY=
# Result: 2 tiers only (PostgreSQL → Fuse.js → Static Fallback)

# Option 3: AI Key Missing (Auto-Disable)
GEMINI_ENABLED=true
# GEMINI_API_KEY not set
# Result: Auto-fallback to static (logs warning)
```

### Backend Behavior Matrix
```
┌────────────────┬──────────────────┬─────────────────────────────────┐
│ GEMINI_ENABLED │ GEMINI_API_KEY   │ Behavior                        │
├────────────────┼──────────────────┼─────────────────────────────────┤
│ true           │ Valid key        │ ✅ All 3 tiers active           │
│ true           │ Invalid key      │ ⚠️  Tier 1 & 2 work, Tier 3     │
│                │                  │    logs error, uses fallback    │
│ true           │ Missing          │ ⚠️  Tier 1 & 2 work, Tier 3     │
│                │                  │    skipped (null check)         │
│ false          │ Any              │ ℹ️  Only Tier 1 & 2 active       │
│                │                  │    Tier 3 uses static fallback  │
└────────────────┴──────────────────┴─────────────────────────────────┘
```

---

## 🎯 Decision Tree for Query Handling

```
User Query Received
├─ Sanitize and normalize input
├─ Check conversation history
└─ Start processing...
    │
    ├─ TIER 1: PostgreSQL Full-Text
    │   ├─ Query: SELECT * FROM faqs WHERE search_vector @@ query
    │   ├─ Threshold: ANY match (to_tsquery)
    │   ├─ Time: 50-200ms
    │   └─ Result?
    │       ├─ YES → Format response
    │       │        Add metadata: source='database', method='postgresql'
    │       │        Add badge: 📚 FAQ Database
    │       │        Return to user
    │       │
    │       └─ NO → Continue to TIER 2
    │
    ├─ TIER 2: Fuse.js Fuzzy Search
    │   ├─ Query: fuse.search(query, { threshold: 0.4 })
    │   ├─ Threshold: 60% similarity (score < 0.4)
    │   ├─ Time: 100-300ms
    │   └─ Result?
    │       ├─ YES → Format response
    │       │        Add metadata: source='fuzzy-search', method='fusejs'
    │       │        Add badge: 📚 FAQ Database
    │       │        Return to user
    │       │
    │       └─ NO → Continue to TIER 3
    │
    ├─ TIER 3: Google Gemini AI
    │   ├─ Check: Is Gemini available?
    │   │   ├─ GEMINI_ENABLED === true?
    │   │   ├─ GEMINI_API_KEY exists?
    │   │   └─ Service initialized?
    │   │
    │   ├─ YES, Available:
    │   │   ├─ Get context: Top 2 related FAQs (if any)
    │   │   ├─ Call API: geminiService.generateAnswer(query, context)
    │   │   ├─ Time: 500-1500ms
    │   │   └─ Result?
    │   │       ├─ SUCCESS → Format response
    │   │       │             Add metadata: source='gemini-ai', method='google-gemini'
    │   │       │             Add badge: 🤖 AI Generated
    │   │       │             Add disclaimer: "This answer was AI-generated..."
    │   │       │             Return to user
    │   │       │
    │   │       └─ ERROR (quota/network/etc)
    │   │                 ├─ Log error with details
    │   │                 └─ Continue to FALLBACK
    │   │
    │   └─ NO, Unavailable:
    │       └─ Continue to FALLBACK
    │
    └─ FALLBACK: Static Response
        ├─ Determine reason:
        │   ├─ AI quota exceeded → reason='quota-exceeded'
        │   ├─ AI error → reason='ai-error'
        │   └─ AI disabled → reason='ai-disabled'
        │
        ├─ Generate message:
        │   "I don't have specific information about that.
        │    Please try rephrasing your question or contact
        │    the barangay office directly."
        │
        ├─ Format response:
        │   Add metadata: source='fallback', method='static-fallback'
        │   Add badge: ℹ️ General Info
        │   Include reason in metadata
        │
        └─ Return to user
```

---

## 📚 File Architecture

```
smartlias/
├── backend/
│   ├── services/
│   │   └── geminiService.js ──────────┐
│   │       │                          │
│   │       ├─ GoogleGenerativeAI      │ AI Layer
│   │       ├─ generateAnswer()        │ (NEW)
│   │       ├─ isAvailable()           │
│   │       └─ estimateTokens()        │
│   │                                  │
│   ├── controllers/                   │
│   │   └── chatbotController.js ──────┤
│   │       │                          │
│   │       ├─ processQuery() ─────────┤ Orchestration
│   │       │   ├─ Tier 1: PostgreSQL │ (MODIFIED)
│   │       │   ├─ Tier 2: Fuse.js    │
│   │       │   └─ Tier 3: Gemini ◄───┘
│   │       │
│   │       └─ hybridSearch() ─────────┐
│   │           ├─ PostgreSQL query    │
│   │           └─ Fuse.js fallback    │ Search Layer
│   │                                  │ (MODIFIED)
│   ├── repositories/                  │
│   │   └── ChatbotRepository.js ◄────┘
│   │       │
│   │       ├─ searchFAQs()           Database Layer
│   │       ├─ getAllFAQs()           (EXISTING)
│   │       └─ getCategoryFAQs()
│   │
│   ├── config/
│   │   └── config.js ─────────────────┐
│   │       │                          │
│   │       ├─ GEMINI_ENABLED          │ Configuration
│   │       └─ GEMINI_API_KEY          │ (MODIFIED)
│   │                                  │
│   └── package.json ◄──────────────────┘
│       └─ @google/generative-ai       Dependency
│                                       (NEW)
│
└── frontend/
    └── components/
        └── common/
            └── Chatbot.jsx ───────────┐
                │                      │
                ├─ Source Badges       │ UI Layer
                ├─ Response Time       │ (MODIFIED)
                ├─ AI Disclaimer       │
                └─ Message Rendering   │
                                       │
                                       │
    Data Flow: ─────────────────────────────────────────────────
    
    User Input
        ↓
    Chatbot.jsx (sendMessage)
        ↓
    POST /api/chatbot/query
        ↓
    chatbotController.processQuery()
        ↓
    ┌─ Tier 1: PostgreSQL (via ChatbotRepository)
    ├─ Tier 2: Fuse.js (via hybridSearch)
    └─ Tier 3: Gemini AI (via geminiService)
        ↓
    Response Object { answer, source, method, metadata... }
        ↓
    Chatbot.jsx (render with badges)
        ↓
    User sees answer with source indicator
```

---

## 🎓 Learning Notes

### Why Three Tiers?
1. **Tier 1 (PostgreSQL)**: Handles 90% of queries in <200ms (exact matches)
2. **Tier 2 (Fuse.js)**: Catches typos/variations in <300ms (5% of queries)
3. **Tier 3 (Gemini AI)**: Smart fallback for complex questions (5% of queries)

### Why This Order?
- **Fast → Faster → Smartest**: Try cheap/fast options first
- **Cost Optimization**: Avoid API calls when rule-based works
- **User Experience**: Most queries get instant answers

### Why Track Source?
- **Transparency**: Users know if answer is from FAQ or AI
- **Analytics**: See which queries need new FAQs
- **Trust**: Clear disclaimers for AI-generated content

### Why Minimal Context for AI?
- **Speed**: Less context = faster generation (500ms vs 2000ms)
- **Cost**: Fewer tokens = lower cost (if upgrading to paid)
- **Quality**: Often better to generate fresh than use irrelevant context

---

**Ready to Test?** Follow `GEMINI-AI-SETUP.md` for configuration!

---

**Last Updated**: January 2025  
**Version**: 1.2.0 (AI-Enhanced)  
**Complexity**: Lightweight (96 lines, 1 dependency)  
**Cost**: $0/month (free tier)
