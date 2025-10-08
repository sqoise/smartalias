# SmartLias Chatbot - Technology Stack

## 🎯 Overview

The SmartLias chatbot is a full-stack FAQ system that helps residents get instant answers to common questions about barangay services, documents, and procedures.

---

## 📚 Technology Stack

### 🎨 Frontend (User Interface)

#### **Next.js 15+**
- **What it is**: React framework for building web applications
- **What we use it for**: 
  - Rendering the chatbot interface
  - Managing page routing (login, home, admin pages)
  - Server-side rendering for fast page loads
- **Files**: 
  - `frontend/app/*` - All pages
  - `frontend/components/*` - Reusable UI components

#### **React 19+**
- **What it is**: JavaScript library for building user interfaces
- **What we use it for**:
  - Creating interactive chatbot components
  - Managing chat state (messages, loading, conversations)
  - Handling user inputs and button clicks
- **Key Components**:
  - `Chatbot.jsx` - Main chat interface (300+ lines)
  - `ChatbotButton.jsx` - Floating trigger button

#### **Tailwind CSS 4+**
- **What it is**: Utility-first CSS framework
- **What we use it for**:
  - Styling the chatbot UI (colors, spacing, animations)
  - Responsive design (mobile and desktop)
  - Message bubbles, buttons, animations
- **Design Features**:
  - Blue gradient chatbot button
  - Smooth open/close animations
  - Mobile-responsive chat window
  - Message bubble styling (user vs bot)

---

### ⚙️ Backend (Server & Logic)

#### **Node.js**
- **What it is**: JavaScript runtime for server-side programming
- **What we use it for**:
  - Running the backend server
  - Processing chatbot queries
  - Connecting to database
- **Version**: Latest LTS

#### **Express.js 4+**
- **What it is**: Web framework for Node.js
- **What we use it for**:
  - Creating API endpoints (8 chatbot routes)
  - Handling HTTP requests/responses
  - Middleware (authentication, rate limiting)
- **Key Files**:
  - `backend/app.js` - Express configuration
  - `backend/router.js` - API routes
  - `backend/server.js` - Server startup

---

### 🗄️ Database (Data Storage)

#### **PostgreSQL 12+**
- **What it is**: Relational database management system
- **What we use it for**:
  - Storing FAQ questions and answers
  - Saving chat conversations and messages
  - Tracking FAQ views and feedback
- **Tables**:
  - `faq_categories` - Document types, services, etc.
  - `faqs` - Questions, answers, keywords
  - `chat_conversations` - User chat sessions
  - `chat_messages` - Individual messages

#### **Full-Text Search (PostgreSQL Feature)**
- **What it is**: Built-in search capability in PostgreSQL
- **What we use it for**:
  - Fast searching through FAQ questions
  - Semantic matching (understands related words)
  - Ranking results by relevance
- **Features**:
  - Word stemming (run, running, ran = same)
  - Weighted search (question > keywords > answer)
  - ~10-50ms response time

---

### 🔍 Search Technology

#### **Fuse.js 7+**
- **What it is**: Lightweight fuzzy search library
- **What we use it for**:
  - Handling typos and misspellings
  - Finding matches when PostgreSQL returns nothing
  - Improving search tolerance
- **Examples**:
  - `"documnets"` → finds `"documents"`
  - `"barangay clereance"` → finds `"barangay clearance"`
  - `"ofice hours"` → finds `"office hours"`
- **Configuration**:
  - Threshold: 0.4 (balanced tolerance)
  - Distance: 100 characters
  - Weighted keys (question 50%, keywords 30%, answer 20%)

#### **Hybrid Search Strategy**
- **How it works**:
  ```
  User Query
      ↓
  Step 1: PostgreSQL Full-Text Search (Fast)
      ├─ Match Found? → Return Results ✓
      └─ No Match? → Continue to Step 2
      ↓
  Step 2: Fuse.js Fuzzy Search (Typo-Tolerant)
      ├─ Match Found? → Return Results ✓
      └─ No Match? → Generate Fallback Response
  ```
- **Benefits**:
  - Best of both worlds (speed + flexibility)
  - No performance impact on exact matches
  - ~85% match rate (up from ~60%)

---

### 🔐 Security & Authentication

#### **JWT (JSON Web Tokens)**
- **What it is**: Token-based authentication
- **What we use it for**:
  - User authentication (optional for chatbot)
  - Securing admin endpoints
  - Session management
- **Library**: `jsonwebtoken`

#### **Bcrypt**
- **What it is**: Password hashing library
- **What we use it for**:
  - Securely storing user passwords
  - Verifying login credentials
- **Strength**: 12 rounds

#### **Input Validation & Sanitization**
- **What it is**: Cleaning and validating user input
- **What we use it for**:
  - Preventing SQL injection
  - Preventing XSS attacks
  - Ensuring data integrity
- **File**: `backend/utils/validator.js`

#### **Rate Limiting**
- **What it is**: Limiting request frequency
- **What we use it for**:
  - Preventing API abuse
  - Protecting against DDoS attacks
- **Limits**: 5 requests per 15 minutes per IP

---

### 📊 Logging & Monitoring

#### **Winston**
- **What it is**: Logging library for Node.js
- **What we use it for**:
  - Application event logging
  - Error tracking
  - Search method monitoring
- **Log Files**:
  - `application.log` - All events
  - `error.log` - Errors only
  - `access.log` - HTTP requests

#### **Morgan**
- **What it is**: HTTP request logger
- **What we use it for**:
  - Logging all API requests
  - Monitoring response times
  - Debugging API issues

---

### 📡 API Communication

#### **RESTful API**
- **What it is**: Architectural style for web services
- **What we use it for**:
  - Frontend-backend communication
  - Standardized request/response format
- **Format**: JSON

#### **Fetch API**
- **What it is**: Browser API for HTTP requests
- **What we use it for**:
  - Making API calls from frontend
  - Sending chatbot queries to backend
- **Wrapper**: `frontend/lib/apiClient.js`

#### **Chatbot API Endpoints (8 Total)**
```
GET  /api/chatbot/categories          # List FAQ categories
GET  /api/chatbot/faqs                # List all FAQs
GET  /api/chatbot/faqs/:id            # Get specific FAQ
GET  /api/chatbot/search              # Search FAQs
POST /api/chatbot/query               # Process user query (main endpoint)
POST /api/chatbot/faqs/:id/feedback   # Submit feedback
GET  /api/chatbot/conversations/:id   # Get conversation history
POST /api/chatbot/conversations/:id/end # End conversation
```

---

## 🏗️ Architecture Pattern

### **Repository Pattern**
- **What it is**: Data access layer abstraction
- **What we use it for**:
  - Separating database logic from business logic
  - Making code testable and maintainable
- **File**: `backend/repositories/ChatbotRepository.js`
- **Methods**: 15+ database operations

### **Controller Pattern**
- **What it is**: Request handling and business logic layer
- **What we use it for**:
  - Processing chatbot queries
  - Coordinating between repository and API
  - Response formatting
- **File**: `backend/controllers/chatbotController.js`
- **Key Methods**:
  - `processQuery()` - Main query processor
  - `hybridSearch()` - Search coordinator
  - `generateFallbackResponse()` - Fallback handler

### **Component Pattern (Frontend)**
- **What it is**: Reusable UI building blocks
- **What we use it for**:
  - Building modular, maintainable UI
  - Separating concerns (logic vs presentation)
- **Structure**:
  - **Smart Parent**: `app/*/page.js` (business logic)
  - **Dumb Child**: `components/*` (UI presentation)

---

## 📦 NPM Packages (Dependencies)

### Backend
```json
{
  "express": "^4.x",           // Web framework
  "pg": "^8.11.0",             // PostgreSQL client
  "fuse.js": "^7.1.0",         // Fuzzy search
  "jsonwebtoken": "^9.x",      // JWT authentication
  "bcryptjs": "^2.x",          // Password hashing
  "winston": "^3.x",           // Logging
  "morgan": "^1.x",            // HTTP logging
  "cors": "^2.x",              // Cross-origin requests
  "dotenv": "^16.x",           // Environment variables
  "express-rate-limit": "^6.x" // Rate limiting
}
```

### Frontend
```json
{
  "next": "^15.x",             // React framework
  "react": "^19.x",            // UI library
  "react-dom": "^19.x",        // DOM rendering
  "tailwindcss": "^4.x",       // CSS framework
  "autoprefixer": "^10.x",     // CSS vendor prefixes
  "postcss": "^8.x"            // CSS processing
}
```

---

## 🔄 Data Flow

### User Sends Message
```
1. User types in Chatbot.jsx
   ↓
2. Frontend sends POST to /api/chatbot/query
   ↓
3. Backend receives in chatbotController.js
   ↓
4. processQuery() validates and sanitizes input
   ↓
5. hybridSearch() tries PostgreSQL first
   ↓
6. If no match, tries Fuse.js fuzzy search
   ↓
7. ChatbotRepository.js queries database
   ↓
8. Results formatted and returned to frontend
   ↓
9. Chatbot.jsx displays response
   ↓
10. Message saved to chat_messages table
```

---

## 🎯 Key Features Enabled by Stack

### 1. Real-Time Chat Experience
- **React State Management**: Instant UI updates
- **WebSocket Alternative**: Polling for real-time feel
- **Optimistic Updates**: Show messages immediately

### 2. Intelligent Search
- **PostgreSQL Full-Text**: Fast, semantic search
- **Fuse.js Fuzzy**: Typo tolerance
- **Hybrid Strategy**: Best of both worlds

### 3. Scalability
- **Database Connection Pooling**: Handle multiple users
- **Rate Limiting**: Prevent abuse
- **Efficient Queries**: Indexed searches

### 4. Security
- **JWT Tokens**: Secure authentication
- **Input Sanitization**: Prevent attacks
- **CORS Configuration**: Controlled access
- **Password Hashing**: Secure storage

### 5. Maintainability
- **Repository Pattern**: Clean separation
- **Comprehensive Logging**: Easy debugging
- **Modular Components**: Easy updates
- **Environment Variables**: Flexible configuration

---

## 🔧 Development Tools

### **Make Commands**
```bash
make dev          # Start both frontend and backend
make frontend     # Start frontend only
make backend      # Start backend only
make stop         # Stop all servers
```

### **Database Tools**
- **psql**: PostgreSQL command-line client
- **pgAdmin**: GUI database management (optional)

### **Testing Tools**
- **curl**: API testing
- **Postman**: API testing (optional)
- **jq**: JSON formatting for terminal

### **Scripts**
- `setup-chatbot.sh` - Database initialization
- `test-chatbot-search.sh` - Automated testing

---

## 📈 Performance Metrics

| Metric | Value | Method |
|--------|-------|--------|
| Exact Match | 10-50ms | PostgreSQL |
| Fuzzy Match | 50-200ms | Fuse.js |
| Average Response | < 200ms | Hybrid |
| Match Accuracy | ~85% | With typos |
| Concurrent Users | 100+ | Connection pool |

---

## 🌟 Why This Stack?

### **PostgreSQL**
- ✅ Mature, reliable, open-source
- ✅ Built-in full-text search
- ✅ ACID compliance for data integrity
- ✅ Excellent performance

### **Node.js + Express**
- ✅ JavaScript everywhere (frontend + backend)
- ✅ Large ecosystem (npm packages)
- ✅ Fast, non-blocking I/O
- ✅ Easy to learn

### **Next.js + React**
- ✅ Modern, component-based UI
- ✅ Server-side rendering (SEO-friendly)
- ✅ Great developer experience
- ✅ Active community

### **Fuse.js**
- ✅ Lightweight (no external dependencies)
- ✅ Client or server-side usage
- ✅ Highly configurable
- ✅ Great for small-medium datasets

---

## 📚 Learning Resources

### Official Documentation
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev/
- **Express**: https://expressjs.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Fuse.js**: https://fusejs.io/

### Project Files to Study
1. `backend/controllers/chatbotController.js` - Business logic
2. `frontend/components/common/Chatbot.jsx` - UI component
3. `backend/repositories/ChatbotRepository.js` - Database operations
4. `.local/db/chatbot-schema.sql` - Database structure

---

## 🎓 Understanding the Code

### For Beginners
**Start Here**:
1. `.local/db/chatbot-schema.sql` - See data structure
2. `frontend/components/common/Chatbot.jsx` - See UI
3. `backend/router.js` - See API endpoints
4. `CHATBOT-QUICKSTART.md` - Quick start guide

### For Intermediate
**Deep Dive**:
1. `backend/controllers/chatbotController.js` - Business logic
2. `backend/repositories/ChatbotRepository.js` - Database queries
3. `frontend/lib/apiClient.js` - API communication
4. `backend/docs/fuse-integration.md` - Search implementation

### For Advanced
**Architecture**:
1. Study the Repository pattern
2. Understand the Hybrid search strategy
3. Review the Component architecture (Smart/Dumb)
4. Analyze the JWT authentication flow

---

## 🔮 Future Enhancements

### Possible Upgrades
1. **Redis**: For caching frequently asked questions
2. **Socket.io**: For true real-time chat
3. **Elasticsearch**: For advanced search features
4. **OpenAI API**: For AI-powered responses
5. **Docker**: For containerized deployment

### Why Not Now?
- ✅ Current stack meets all requirements
- ✅ Simpler to maintain
- ✅ Lower costs
- ✅ Easier to understand and modify

---

## ✨ Summary

The SmartLias chatbot uses a **modern, practical stack** that balances:
- ✅ **Performance**: Fast responses (< 200ms)
- ✅ **Reliability**: Proven technologies
- ✅ **Maintainability**: Clean, organized code
- ✅ **Scalability**: Can handle growth
- ✅ **Developer Experience**: Easy to work with

**Technology Choices**:
- **Frontend**: Next.js + React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Full-Text Search
- **Search**: Hybrid (PostgreSQL + Fuse.js)
- **Security**: JWT + Bcrypt + Validation
- **Logging**: Winston + Morgan

**Result**: A fast, intelligent, user-friendly chatbot that handles typos and provides instant answers to resident questions!

---

**Last Updated**: October 8, 2025  
**Version**: 1.1.0 (Hybrid Search)  
**Status**: Production Ready ✅
