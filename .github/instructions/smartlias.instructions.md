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
│   │   ├── layout.js      # Root layout component
│   │   └── page.js        # Homepage
│   ├── components/        # Reusable UI components (Dumb Children)
│   │   ├── authenticated/ # Protected components
│   │   ├── common/        # Shared components (ToastNotification, etc.)
│   │   └── public/        # Public components (LoginCard, etc.)
│   ├── lib/               # Frontend utilities & auth
│   ├── data/              # Sample JSON data (demo)
│   ├── styles/            # CSS and styling
│   └── package.json       # Frontend dependencies
│
├── backend/               # Express.js API Server (Port 5000)
│   ├── routes/            # API route definitions
│   ├── middleware/        # Auth, logging, error handlers
│   ├── server.js          # Application entry point
│   └── package.json       # Backend dependencies
│
├── Makefile               # Development commands
├── README.md              # Project documentation

### **Technology Stack**
- **Frontend**: Next.js 15+ with React 19+, Tailwind CSS 4+
- **Backend**: Express.js 4+ with Node.js
- **Database**: Supabase (PostgreSQL) - planned
- **Authentication**: JWT tokens with session management
- **Development**: Separated frontend-backend with API communication

### **Current Development Phase**
- ✅ **Phase 1**: Frontend-only development (COMPLETED)
- 🔄 **Phase 2**: Backend API development (IN PROGRESS)
- 📋 **Phase 3**: Full-stack integration (PLANNED)

### **Core Features**
- User authentication and role-based access control
- Resident management and documentation
- Service request handling and tracking
- Administrative dashboard and reporting
- Mobile-first responsive design

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
- **NO EMOJIS** in code, comments, or commit messages
- **NO EMOTICONS** or decorative symbols in production code
- **Clean Text**: Professional language without decorative symbols
- **Demo Comments**: Mark temporary code with `// Demo:` for easy identification

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

### **🔧 API Development Standards**

#### **RESTful API Design**
- **Base URL**: `http://localhost:5000/api` (development)
- **Format**: JSON for all request/response payloads
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

#### **API Endpoints Structure**
```
Authentication:
POST   /api/auth/login          # User authentication
POST   /api/auth/logout         # Session termination
GET    /api/auth/me            # Get current user info
POST   /api/auth/change-password # Password update

Residents Management:
GET    /api/residents          # List all residents
POST   /api/residents          # Create new resident
GET    /api/residents/:id      # Get resident details
PUT    /api/residents/:id      # Update resident
DELETE /api/residents/:id      # Delete resident

Service Requests:
GET    /api/requests           # List service requests
POST   /api/requests           # Create new request
GET    /api/requests/:id       # Get request details
PUT    /api/requests/:id       # Update request status

Admin Operations:
GET    /api/admin/dashboard    # Admin dashboard data
GET    /api/admin/users        # User management
```

#### **Data Source Management (MANDATORY)**

**Environment-Controlled Data Sources:**

All data access MUST be controlled through environment variables to enable seamless switching between development (JSON files) and production (database) without code changes.

**Frontend Implementation (`lib/auth.js`):**
```javascript
const API_CONFIG = {
  // Environment-controlled data source
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || false,
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
}

class ApiClient {
  static async request(endpoint, options = {}) {
    if (API_CONFIG.USE_MOCK_DATA) {
      // Use JSON files (development)
      return MockApiService.handleRequest(endpoint, options)
    }
    
    // Use real backend API (production)
    const url = `${API_CONFIG.BASE_URL}${endpoint}`
    // ... real API implementation
  }
}
```

**Environment Configuration:**
```env
# Development
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Production
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_URL=https://api.yourcompany.com
```

**Benefits:**
- ✅ **Zero Code Changes**: Switch environments via configuration only
- ✅ **Development Speed**: Work with JSON files while backend is being built
- ✅ **Testing Flexibility**: Test with known data sets or live API
- ✅ **Deployment Safety**: Production flag prevents accidental mock data usage

#### **Security Implementation**
```javascript
// Input Sanitization (Backend)
const sanitizeInput = (input) => {
  return input?.trim()?.replace(/[<>'"&]/g, '')?.slice(0, 100) || ''
}

// Validation Template
const validateInputs = (data) => {
  const errors = []
  // Mirror frontend validation rules
  return errors
}

// Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  // Verify JWT token
}
```

#### **Database Integration**
- **Database**: Supabase (PostgreSQL)
- **ORM**: Direct SQL queries or Prisma (planned)
- **Environment**: Database connection via environment variables
- **Security**: Parameterized queries to prevent SQL injection

#### **Error Handling**
```javascript
// Standardized Error Response
const sendError = (res, status, message, details = null) => {
  res.status(status).json({
    success: false,
    error: {
      message,
      details,
      timestamp: new Date().toISOString()
    }
  })
}

// Success Response
const sendSuccess = (res, data, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  })
}
```

#### **Middleware Stack**
- **Authentication**: JWT token validation
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Express-rate-limit for API protection
- **CORS**: Configured for frontend-backend communication
- **Helmet**: Security headers
- **Logging**: Request/response logging for debugging

#### **Environment Configuration**
```env
# Backend Environment Variables
PORT=5000
NODE_ENV=development
DATABASE_URL=your-supabase-connection-string
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
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
- [ ] Read this context.md file completely
- [ ] Follow "Smart Parent, Dumb Child" pattern
- [ ] Reference existing login page for validation patterns
- [ ] Use mobile-first design system classes
- [ ] Implement proper input sanitization
- [ ] Use environment variables for data source control

### **For Frontend Development**
- [ ] Create Smart Parent component in `app/`
- [ ] Create Dumb Child component in `components/`
- [ ] Apply inline field validation (no toast for validation)
- [ ] Use consistent color schemes and styling
- [ ] Add loading states for all async operations
- [ ] Test mobile responsiveness
- [ ] Configure environment variables for API endpoints

### **For Backend Development**
- [ ] Create RESTful API endpoints following naming convention
- [ ] Implement input sanitization and validation
- [ ] Add JWT authentication middleware
- [ ] Use standardized error/success response format
- [ ] Add request/response logging
- [ ] Test with Postman or similar API client

### **Quality Assurance**
- [ ] Test validation on both frontend and backend
- [ ] Verify sanitization prevents XSS attacks
- [ ] Check mobile responsiveness across devices
- [ ] Ensure consistent error messaging
- [ ] Validate accessibility with screen readers
- [ ] Test API endpoints independently

### **Key Reference Files**
- **Frontend Patterns**: `app/login/page.js`
- **Component Structure**: `components/public/LoginCard.jsx`
- **Data Source Management**: `lib/auth.js`
- **Environment Configuration**: `.env.local`
- **Design System**: This smartlias.instructions.md file
- **API Patterns**: Backend route files (when created)
- **Production Release Guide**: `.github/instructions/production-release-guide.md`

---

## 🚀 PRODUCTION DEPLOYMENT

### **Production Release Preparation**

When preparing SMARTLIAS for production deployment, several demo-specific features and test code must be removed or configured. Follow the comprehensive guide located at:

**📋 Complete Guide**: [Production Release Guide](./production-release-guide.md)

### **Key Production Changes**

#### **Demo Mode Configuration**
```javascript
// Current: Environment-controlled data source
USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// Production: Set environment variable to switch to backend API
// NEXT_PUBLIC_USE_MOCK_DATA=false (uses backend API)
// NEXT_PUBLIC_USE_MOCK_DATA=true (uses JSON files)
```

#### **Critical Files to Review**
- **`components/public/LoginCard.jsx`**: Demo user interface elements
- **`lib/auth.js`**: Data source configuration (mock vs. live API)
- **`.env.local`**: Environment variables for data source control
- **`data/users.json`**: Demo user accounts and test data

#### **Production Deployment Checklist**
- [ ] Set `NODE_ENV=production` in deployment environment
- [ ] Configure real database connection (replace JSON files)
- [ ] Update authentication endpoints to real backend API
- [ ] Remove or secure demo user accounts
- [ ] Test login flow with production credentials
- [ ] Verify demo features are properly hidden
- [ ] Configure proper CORS settings for production domain
- [ ] Set up proper error logging and monitoring

#### **Environment Variables (Production)**
```env
NODE_ENV=production
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_URL=https://your-api-domain.com
DATABASE_URL=your-production-database-url
JWT_SECRET=your-secure-jwt-secret
```

#### **Security Considerations**
- Remove all demo credentials and test accounts
- Implement proper password policies and validation
- Configure rate limiting for authentication endpoints
- Set up proper session management and token expiration
- Enable HTTPS for all production traffic
- Configure proper CORS policies

### **Deployment Verification**
After deployment, verify:
1. Login page shows no demo credentials
2. Authentication works with real user accounts
3. All demo features are hidden from production users
4. Error handling works properly in production
5. Security headers and HTTPS are properly configured

---

**Last Updated**: September 10, 2025  
**Current Phase**: Backend API Development & Integration  
**Architecture**: Separated Frontend (Next.js) + Backend (Express.js)  
**Development Status**: COMPLETED: Frontend architecture, IN PROGRESS: Backend API development
