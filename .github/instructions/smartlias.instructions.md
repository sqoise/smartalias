---
applyTo: '**'
---
# SMARTLIAS - Project Documentation & Guidelines

## 📋 PROJECT OVERVIEW

**SMARTLIAS** is a barangay management system built with modern full-stack architecture. The system provides comprehensive resident management, service request handling, and administrative tools for barangay operations.

### **Project Structure**
```
smartlias/
├── frontend/              # Next.js React Application (Port 3000)
│   ├── app/               # Next.js app directory routes (Smart Parents)
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── login/         # Login page
│   │   ├── resident/      # Resident dashboard pages
│   │   ├── change-pin/    # PIN change functionality
│   │   ├── layout.js      # Root layout component
│   │   └── page.js        # Homepage
│   ├── components/        # Reusable UI components (Dumb Children)
│   │   ├── authenticated/ # Protected components
│   │   ├── common/        # Shared components (ToastNotification, etc.)
│   │   └── public/        # Public components (LoginCard, etc.)
│   ├── lib/               # Frontend utilities & API client
│   │   ├── apiClient.js   # Centralized API connector
│   │   └── constants.js   # Frontend constants
│   ├── styles/            # CSS and styling
│   └── package.json       # Frontend dependencies
│
├── backend/               # Express.js API Server (Port 9000)
│   ├── config/            # Configuration files
│   │   ├── config.js      # Environment variables & settings
│   │   ├── logger.js      # Winston logging configuration
│   │   ├── db.js          # Database connection (future)
│   │   └── rateLimit.js   # Rate limiting configuration
│   ├── middleware/        # Express middleware
│   │   └── authMiddleware.js # JWT authentication & authorization
│   ├── utils/             # Utility functions
│   │   └── validator.js   # Input validation & sanitization
│   ├── models/            # Data access layer
│   │   └── residentModel.js # Resident data operations
│   ├── controllers/       # HTTP request handlers
│   │   └── residentController.js # Resident business logic
│   ├── data/              # JSON data files (temporary)
│   │   ├── users.json     # User accounts
│   │   └── residents.json # Resident records
│   ├── logs/              # Application logs (git ignored)
│   │   ├── application.log # All application logs
│   │   ├── error.log      # Error logs only
│   │   └── access.log     # HTTP request logs
│   ├── router.js          # Centralized API routes
│   ├── app.js             # Express app configuration
│   ├── server.js          # Server startup
│   └── package.json       # Backend dependencies
│
├── Makefile               # Development commands
└── README.md              # Project documentation
```

### **Technology Stack**
- **Frontend**: Next.js 15+ with React 19+, Tailwind CSS 4+
- **Backend**: Express.js 4+ with Node.js
- **Database**: JSON files (development) → Supabase PostgreSQL (planned)
- **Authentication**: JWT tokens with bcryptjs hashing
- **Logging**: Winston + Morgan (server-side only)
- **Development**: Separated frontend-backend with API communication

### **Current Development Phase**
- ✅ **Phase 1**: Frontend-only development (COMPLETED)
- ✅ **Phase 2**: Backend API development (COMPLETED)
- � **Phase 3**: Full-stack integration (IN PROGRESS)
- 📋 **Phase 4**: Database migration (PLANNED)

### **Core Features**
- User authentication and role-based access control
- Resident management and documentation
- Service request handling and tracking
- Administrative dashboard and reporting
- Mobile-first responsive design
- Comprehensive logging system

---

## � FRONTEND GUIDELINES

### **🏗️ Architecture Principles**

#### **Frontend-Backend Separation (MANDATORY)**
This project follows **strict separation** between frontend and backend:

**📁 Frontend Responsibilities**:
- UI components and presentation logic
- Client-side state management and routing
- Form validation (client-side feedback only)
- API consumption via HTTP requests
- **NO backend logic, database operations, or business rules**

**📁 Backend Responsibilities**:
- RESTful API endpoints and business logic
- Database operations and data validation
- Authentication, authorization, and security
- Data processing and transformation
- **NO UI rendering or presentation logic**

#### **Communication Pattern**
```
Frontend (Next.js) ←→ HTTP/HTTPS API calls ←→ Backend (Express.js) ←→ Database
```

### **🧠 Component Architecture: "Smart Parent, Dumb Child" Pattern**

**MANDATORY**: All React components MUST follow this pattern for maintainable, testable code.

#### **🧠 Smart Parent Components (Container/Page Components)**
**Location**: `app/` directory (Next.js pages)

**Responsibilities** (ALL business logic):
- ✅ **State Management**: All useState, useEffect, and state logic
- ✅ **API Calls**: All fetch requests and backend communication
- ✅ **Business Logic**: Validation, data processing, calculations
- ✅ **Event Handling**: Complex logic for user interactions
- ✅ **Error Handling**: Toast notifications, error states
- ✅ **Navigation**: Router logic and page transitions
- ✅ **Data Flow Control**: Manages when and how data flows to children

**Example Structure**:
```jsx
// app/login/page.js (Smart Parent)
export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [errors, setErrors] = useState({})
  
  const validateUsername = (username) => { /* business rules */ }
  const handleLogin = async () => { /* API logic */ }
  
  return (
    <LoginCard
      username={username}
      onUsernameChange={setUsername}
      onSubmit={handleLogin}
      errors={errors}
    />
  )
}
```

#### **🎨 Dumb Child Components (Presentation Components)**
**Location**: `components/` directory

**Responsibilities** (ONLY presentation):
- ✅ **UI Rendering**: JSX structure and styling only
- ✅ **Props Interface**: Accept data and callbacks from parent
- ✅ **Event Forwarding**: Call parent handlers (no complex logic)
- ✅ **Local UI State**: Only simple UI state (modal open/close, etc.)

**What Dumb Children CANNOT Do**:
- ❌ **NO API calls** or backend communication
- ❌ **NO business logic** or complex calculations
- ❌ **NO validation logic** (except basic UI feedback)
- ❌ **NO state management** beyond simple UI state
- ❌ **NO error handling** beyond displaying error props

**Example Structure**:
```jsx
// components/public/LoginCard.jsx (Dumb Child)
export default function LoginCard({
  username,
  onUsernameChange,
  onSubmit,
  errors
}) {
  const [showModal, setShowModal] = useState(false) // Only simple UI state
  const handleSubmit = () => onSubmit(username)     // Only event forwarding
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={username}
        onChange={(e) => onUsernameChange(e.target.value)}
      />
      {errors.username && <span>{errors.username}</span>}
    </form>
  )
}
```

**⚠️ RULE**: If adding business logic to `components/`, move it to the parent page component instead!

### **🎯 Development Standards**

#### **Code Quality Rules**
- **NO EMOJIS** in code, comments, commit messages, or any output text
- **NO EMOTICONS** or decorative symbols in production code or console output
- **Clean Text**: Professional language without decorative symbols in all output
- **Demo Comments**: Mark temporary code with `// Demo:` for easy identification
- **Simple Output**: All server messages, console logs, and responses use plain text only

#### **Validation Pattern (MANDATORY)**
```javascript
// CORRECT: Clean validation flow
const validateForm = () => {
  // Frontend validation with inline field errors
  // NO toast notifications for validation errors
  // Toast only for server responses
}

const handleSubmit = async (e) => {
  if (!validateForm()) {
    return // Show inline errors only, no toast
  }
  // Continue with submission...
}
```

#### **Input Sanitization (REQUIRED)**
```javascript
const sanitizeInput = (input) => {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove XSS characters
    .slice(0, 100)           // Prevent buffer overflow
}
```

#### **Toast Notification Rules**
- **Use toasts for**: Server responses, network errors, success messages
- **Don't use toasts for**: Field validation errors (use inline errors)
- **Color coding**: error (red), success (green), info (blue), warning (amber)

#### **API Integration**
- Use `fetch()` for HTTP requests to backend
- JSON for request/response payloads
- JWT tokens for authentication
- Standardized error handling

#### **Environment Variable Data Source Control (MANDATORY)**

**All data source switching MUST use environment variables:**

```javascript
// CORRECT: Environment-controlled data source
const API_CONFIG = {
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || false,
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
}
```

**Environment Configuration:**
```env
# Development (.env.local)
NEXT_PUBLIC_USE_MOCK_DATA=true    # Uses JSON files for development
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Production (deployment environment)
NEXT_PUBLIC_USE_MOCK_DATA=false   # Uses real backend API
NEXT_PUBLIC_API_URL=https://api.yourcompany.com
```

**Benefits:**
- ✅ **No Code Changes**: Switch data sources without touching code
- ✅ **Environment Specific**: Different settings for dev/staging/production
- ✅ **CI/CD Friendly**: Set environment variables in deployment pipeline
- ✅ **Team Friendly**: Each developer can customize their local environment
- ✅ **Safe Defaults**: Explicit boolean checking with fallback values

**Rules:**
- **NEVER** hardcode `true`/`false` for data source switching
- **ALWAYS** use `NEXT_PUBLIC_` prefix for client-side environment variables
- **ALWAYS** provide safe defaults with `|| false` pattern
- **ALWAYS** document environment variables in project documentation

### **📱 Mobile-First Design System**

#### **Core Principles**
- **Target**: 90% mobile users
- **Touch Targets**: 36px minimum height
- **Font Size**: 14px (text-sm) as standard
- **Spacing**: Compact but readable

#### **Form Elements (36px height)**
```jsx
// Input Fields
className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 
           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
           placeholder:text-gray-400 bg-white"

// Error State
className="w-full rounded-md px-3 py-1.5 text-sm border border-red-300 
           focus:border-red-500 focus:ring-1 focus:ring-red-500"

// Labels
className="block text-sm font-medium text-gray-700 mb-1"

// Form Groups
className="mb-3"

// Error Messages
className="text-xs text-red-600 mt-1"
```

#### **Buttons (36px height)**
```jsx
// Primary Button
className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium 
           rounded-md border bg-blue-600 border-blue-600 text-white 
           hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 focus:outline-none
           disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"

// Secondary Button
className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium 
           rounded-md border bg-white border-gray-300 text-gray-700
           hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:outline-none"
```

#### **Layout Elements**
```jsx
// Cards (Mobile-responsive)
className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6"

// Containers
className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6"

// Typography
className="text-lg font-bold text-gray-900 mb-2 sm:text-xl sm:mb-3" // Large headings
className="text-sm text-gray-600 leading-relaxed sm:text-base"       // Body text
```

#### **Color Palette**
- **Primary**: blue-600, blue-700 (buttons, focus states)
- **Success**: green-600, green-50
- **Warning**: yellow-600, yellow-50
- **Error**: red-600, red-50
- **Neutral**: gray-900, gray-700, gray-600, gray-300, gray-200

#### **Alerts/Notifications**
```jsx
className="p-3 rounded-md border text-sm bg-blue-50 border-blue-200 text-blue-800" // Info
className="p-3 rounded-md border text-sm bg-green-50 border-green-200 text-green-800" // Success
className="p-3 rounded-md border text-sm bg-red-50 border-red-200 text-red-800" // Error
```

---

## ⚙️ BACKEND GUIDELINES

### **🔧 Centralized Backend Architecture**

#### **File Structure (Simplified & Organized)**
```
backend/
├── server.js              # Server startup and initialization
├── app.js                 # Express app configuration and middleware
├── router.js              # Centralized API routes (all endpoints)
├── config/                # Configuration files
│   ├── config.js          # Environment variables and settings
│   ├── logger.js          # Winston logging configuration
│   ├── db.js              # Database connection setup
│   └── rateLimit.js       # Rate limiting configuration
├── middleware/            # Express middleware
│   └── authMiddleware.js  # JWT authentication and authorization
├── utils/                 # Utility functions
│   └── validator.js       # Input validation and sanitization
├── models/                # Data access layer (future database integration)
│   └── residentModel.js   # Resident data operations
├── controllers/           # Business logic (future expansion)
│   └── residentController.js # HTTP request handlers
├── data/                  # JSON data files (temporary)
│   ├── users.json         # User accounts and authentication
│   └── residents.json     # Resident records
├── logs/                  # Application logs (auto-generated, git ignored)
│   ├── application.log    # All application logs
│   ├── error.log          # Error logs only
│   └── access.log         # HTTP request logs
└── package.json           # Dependencies and scripts
```

#### **Centralized Router Approach**
- **router.js**: All API endpoints in one file for simplicity
- **Authentication routes**: `/api/auth/*` (login, logout, check-user, etc.)
- **Residents routes**: `/api/residents/*` (CRUD operations)
- **Admin routes**: `/api/admin/*` (future expansion)
- Easy to understand and maintain for learning purposes

#### **Benefits of This Structure**
- Simple and organized - each file has one clear purpose
- Centralized routes - all endpoints visible in one file
- Professional logging - Winston + Morgan for comprehensive logs
- Security-focused - JWT authentication, input validation, rate limiting
- Scalable - easy to add new features without restructuring

#### **RESTful API Design**
- **Base URL**: `http://localhost:9000/api` (development)
- **Port**: 9000 (backend), 3000 (frontend)
- **Format**: JSON for all request/response payloads
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

#### **API Endpoints Structure**
```
Authentication:
POST   /api/auth/login              # User authentication
POST   /api/auth/logout             # Session termination
GET    /api/auth/me                # Get current user info
POST   /api/auth/change-password    # Password update
POST   /api/auth/check-user         # Username verification

Residents Management:
GET    /api/residents              # List all residents (with search/pagination)
POST   /api/residents              # Create new resident (admin only)
GET    /api/residents/:id          # Get resident details
PUT    /api/residents/:id          # Update resident (admin only)
DELETE /api/residents/:id          # Delete resident (admin only)
GET    /api/residents/stats        # Get resident statistics (admin only)

Admin Operations:
GET    /api/admin/dashboard        # Admin dashboard data
POST   /api/admin/unlock-account   # Unlock user account
GET    /api/admin/account-status   # Get account security status

Health Check:
GET    /health                     # Server health status
```

#### **Logging System (Server-Side Only)**

**Professional Logging with Winston + Morgan:**
```javascript
// Application Logs (Winston)
logger.info('User login successful', { username, role })
logger.warn('Failed login attempt', { username, ip })
logger.error('Database connection failed', error)

// HTTP Request Logs (Morgan)
// Automatically logs all HTTP requests to access.log
// Console logging in development mode
```

**Log Files:**
- `logs/application.log` - All application events, warnings, errors
- `logs/error.log` - Error logs only (automatic filtering)
- `logs/access.log` - HTTP request logs (Morgan)

**Viewing Logs:**
```bash
# View latest logs (live tail)
tail -f backend/logs/application.log
tail -f backend/logs/error.log
tail -f backend/logs/access.log

# View last 50 lines
tail -n 50 backend/logs/application.log

# Search logs
grep "login" backend/logs/application.log
grep "ERROR" backend/logs/application.log
```

#### **Data Source Management**

**Environment-Controlled Data Sources:**
```javascript
// Backend Configuration (config.js)
USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true' || false

// Development: Uses JSON files
USE_MOCK_DATA=true

// Production: Uses database
USE_MOCK_DATA=false
```

**Benefits:**
- ✅ **Zero Code Changes**: Switch data sources via environment variables
- ✅ **Development Speed**: Work with JSON files while database is being set up
- ✅ **Testing Flexibility**: Test with known data sets or live database
- ✅ **Deployment Safety**: Production flag prevents accidental mock data usage

#### **Security Implementation**
```javascript
// Input Sanitization (All endpoints)
const sanitizeInput = (input) => {
  return input?.trim()?.replace(/[<>'"&]/g, '')?.slice(0, 100) || ''
}

// Validation Template
const validateInputs = (data) => {
  const errors = []
  // Comprehensive validation rules
  return { isValid: errors.length === 0, errors }
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  // JWT verification with role-based access
}

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
})
```

#### **Environment Configuration**
```env
# Backend Environment Variables (.env)
PORT=9000
NODE_ENV=development
USE_MOCK_DATA=true
JWT_SECRET=your-secure-jwt-secret
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
DATABASE_URL=your-database-connection-string
```

### **📊 Database Schema Design**

#### **Planned Database Tables**
```sql
-- Users Table (Authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'resident',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Residents Table (Management)
CREATE TABLE residents (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  birth_date DATE,
  civil_status VARCHAR(20),
  address TEXT,
  contact_number VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Requests Table
CREATE TABLE service_requests (
  id SERIAL PRIMARY KEY,
  resident_id INTEGER REFERENCES residents(id),
  request_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table (Authentication Tracking)
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **🔍 Simplified Audit Schema (Essential Only)**

```sql
-- Core Audit Log Table (Database changes only)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (table_name, record_id),
  INDEX (changed_at),
  INDEX (operation)
);

-- Authentication Events Table (Security monitoring only)
CREATE TABLE auth_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGE')),
  username VARCHAR(50),
  user_id INTEGER REFERENCES users(id),
  ip_address INET,
  success BOOLEAN DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (event_type),
  INDEX (username),
  INDEX (created_at)
);
```

#### **🔄 PostgreSQL Automatic Triggers (Database-Level Only)**

```sql
-- Simple audit trigger function (completely automatic)
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, 
      record_id, 
      operation, 
      old_values,
      changed_at
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      row_to_json(OLD),
      NOW()
    );
    RETURN OLD;
  END IF;

  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      operation,
      new_values,
      changed_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      row_to_json(NEW),
      NOW()
    );
    RETURN NEW;
  END IF;

  -- For UPDATE operations (only log actual changes)
  IF TG_OP = 'UPDATE' THEN
    IF row_to_json(OLD) != row_to_json(NEW) THEN
      INSERT INTO audit_logs (
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        changed_at
      ) VALUES (
        TG_TABLE_NAME,
        NEW.id,
        'UPDATE',
        row_to_json(OLD),
        row_to_json(NEW),
        NOW()
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamps trigger (completely automatic)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables only
CREATE TRIGGER users_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER residents_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON residents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER service_requests_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Auto-update timestamps trigger
CREATE TRIGGER users_update_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER residents_update_timestamp
  BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER service_requests_update_timestamp
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

#### **🎯 Benefits of Pure Database-Level Auditing**

- **✅ Zero Application Code**: Completely automatic with PostgreSQL triggers
- **✅ Cannot Be Bypassed**: Works regardless of how data is modified
- **✅ Database-Only Access**: Audit data accessible only through direct database queries
- **✅ Lightweight**: No API overhead or application complexity
- **✅ Compliance Ready**: Tracks all data modifications for government requirements
- **✅ Secure**: No web-exposed audit endpoints to secure

#### **📊 Simplified Audit Schema**

```sql
-- Core audit log table (essential data changes only)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Indexes for fast queries
  INDEX (table_name, record_id),
  INDEX (changed_at),
  INDEX (operation)
);
```



#### **🔍 Database-Only Audit Queries**

Use these SQL queries directly in your database client (pgAdmin, DBeaver, psql, etc.) to view audit data:

```sql
-- See all changes to a specific resident
SELECT 
  operation,
  changed_at,
  old_values,
  new_values
FROM audit_logs 
WHERE table_name = 'residents' AND record_id = 123
ORDER BY changed_at DESC;

-- See all deletions in the last 30 days
SELECT 
  table_name,
  record_id,
  changed_at,
  old_values
FROM audit_logs 
WHERE operation = 'DELETE' 
  AND changed_at >= NOW() - INTERVAL '30 days'
ORDER BY changed_at DESC;

-- Data recovery: Get previous version of a record
SELECT old_values
FROM audit_logs 
WHERE table_name = 'residents' 
  AND record_id = 123 
  AND operation = 'UPDATE'
ORDER BY changed_at DESC
LIMIT 1;

-- Get failed login attempts
SELECT 
  username,
  ip_address,
  failure_reason,
  created_at
FROM auth_events 
WHERE event_type = 'FAILED_LOGIN'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Recent activity summary
SELECT 
  table_name,
  operation,
  COUNT(*) as change_count,
  MAX(changed_at) as last_change
FROM audit_logs 
WHERE changed_at >= NOW() - INTERVAL '7 days'
GROUP BY table_name, operation
ORDER BY last_change DESC;

-- Authentication summary by user
SELECT 
  username,
  event_type,
  COUNT(*) as event_count,
  MAX(created_at) as last_event
FROM auth_events 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY username, event_type
ORDER BY last_event DESC;
```



#### **Data Migration Plan**
1. **Phase 1**: Set up database tables and connections
2. **Phase 2**: Migrate JSON data to database tables
3. **Phase 3**: Update API endpoints to use database
4. **Phase 4**: Remove JSON file dependencies

---

## 📚 DEVELOPMENT CHECKLIST

### **Before Starting New Features**
- [ ] Read this smartlias.instructions.md file completely
- [ ] Follow "Smart Parent, Dumb Child" pattern
- [ ] Reference existing login page for validation patterns
- [ ] Use mobile-first design system classes
- [ ] Implement proper input sanitization
- [ ] Use environment variables for configuration

### **For Frontend Development**
- [ ] Create Smart Parent component in `app/`
- [ ] Create Dumb Child component in `components/`
- [ ] Apply inline field validation (no toast for validation)
- [ ] Use consistent color schemes and styling
- [ ] Add loading states for all async operations
- [ ] Test mobile responsiveness
- [ ] Use `ApiClient` for all backend communication

### **For Backend Development**
- [ ] Add endpoints to centralized `router.js` file
- [ ] Implement input sanitization and validation
- [ ] Add JWT authentication middleware where needed
- [ ] Use standardized error/success response format
- [ ] Add proper logging with winston logger
- [ ] Test endpoints independently with Postman/curl

### **Quality Assurance**
- [ ] Test validation on both frontend and backend
- [ ] Verify sanitization prevents XSS attacks
- [ ] Check mobile responsiveness across devices
- [ ] Ensure consistent error messaging
- [ ] Validate accessibility with screen readers
- [ ] Check logs for proper error tracking

### **Key Reference Files**
- **Frontend Patterns**: `app/login/page.js`
- **Component Structure**: `components/public/LoginCard.jsx`
- **API Communication**: `lib/apiClient.js`
- **Environment Configuration**: `.env.local` (frontend), `.env` (backend)
- **Design System**: This smartlias.instructions.md file
- **Backend API**: `backend/router.js`
- **Logging**: `backend/logs/` directory

---

## 🚀 PRODUCTION DEPLOYMENT

### **Production Environment Configuration**

#### **Backend Environment Variables (Production)**
```env
# Server Configuration
PORT=9000
NODE_ENV=production

# Database Configuration
USE_MOCK_DATA=false
DATABASE_URL=your-production-database-url

# Security Configuration
JWT_SECRET=your-secure-jwt-secret-for-production
FRONTEND_URL=https://your-frontend-domain.com

# Logging Configuration
LOG_LEVEL=warn
```

#### **Frontend Environment Variables (Production)**
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-api-domain.com/api
NEXT_PUBLIC_USE_MOCK_DATA=false

# Application Configuration
NEXT_PUBLIC_APP_NAME=SmartLias
NODE_ENV=production
```

### **Critical Production Changes**

#### **Data Source Configuration**
```javascript
// Backend: Switch to real database
USE_MOCK_DATA=false  // Uses database instead of JSON files

// Frontend: Use production API
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

#### **Security Considerations**
- Replace all demo credentials and test accounts
- Implement proper password policies and validation
- Configure rate limiting for authentication endpoints
- Set up proper session management and token expiration
- Enable HTTPS for all production traffic
- Configure proper CORS policies

#### **Logging Configuration**
- Set `LOG_LEVEL=warn` or `LOG_LEVEL=error` for production
- Configure log rotation to prevent disk space issues
- Set up log monitoring and alerting
- Ensure logs don't contain sensitive information

### **Deployment Checklist**
- [ ] Set `NODE_ENV=production` in deployment environment
- [ ] Configure real database connection (replace JSON files)
- [ ] Update authentication endpoints to production API
- [ ] Remove or secure demo user accounts
- [ ] Test login flow with production credentials
- [ ] Configure proper CORS settings for production domain
- [ ] Set up proper error logging and monitoring
- [ ] Test all API endpoints in production environment
- [ ] Verify logging system works properly
- [ ] Configure HTTPS and security headers

### **Environment Variables Summary**

#### **Development**
```env
# Backend
PORT=9000
USE_MOCK_DATA=true
JWT_SECRET=dev-secret
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:9000/api
NEXT_PUBLIC_USE_MOCK_DATA=false
```

#### **Production**
```env
# Backend
PORT=9000
USE_MOCK_DATA=false
JWT_SECRET=secure-production-secret
FRONTEND_URL=https://your-domain.com
DATABASE_URL=your-production-db-url

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_USE_MOCK_DATA=false
```

---

**Last Updated**: September 11, 2025  
**Current Phase**: Full-stack Integration & Testing  
**Architecture**: Separated Frontend (Next.js) + Backend (Express.js) with Centralized Router  
**Development Status**: COMPLETED: Frontend & Backend architecture, IN PROGRESS: Integration testing and production preparation
