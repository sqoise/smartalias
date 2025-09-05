# SMARTLIAS - Context & Implementation Documentation

## Project Overview
**SMARTLIAS** is a barangay management system built with **separated frontend-backend architecture**. This project demonstrates modern full-stack development practices with clear separation of concerns between the client-side (Next.js) and server-side (Express.js) applications.

## COMPACT MOBILE-FIRST DESIGN SYSTEM (Updated September 2025)

### Design Philosophy
- **Target Users**: 90% mobile phone users
- **Design Style**: Compact, mobile-first, AWS Console-inspired
- **Touch Targets**: 36px minimum height for all interactive elements
- **Font Size**: 14px (text-sm) as standard for readability
- **Color Scheme**: Blue accents, professional neutral palette

### Component Standards

#### Form Elements
```jsx
// Input Fields (36px height)
className="w-full rounded-md px-3 py-1.5 text-sm border border-gray-300 
           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
           placeholder:text-gray-400 bg-white"

// Error State
className="w-full rounded-md px-3 py-1.5 text-sm border border-red-300 
           focus:border-red-500 focus:ring-1 focus:ring-red-500 
           placeholder:text-gray-400 bg-white"

// Labels
className="block text-sm font-medium text-gray-700 mb-1"

// Form Groups (Compact spacing)
className="mb-3"

// Form Container
className="space-y-3"

// Error Messages
className="mt-1 text-xs text-red-600"
```

#### Buttons (36px height)
```jsx
// Primary Button
className="w-full inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium 
           rounded-md border bg-blue-600 border-blue-600 text-white 
           hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 focus:outline-none
           disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed
           transition-colors duration-200 cursor-pointer"

// Secondary Button  
className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium 
           rounded-md border bg-white border-gray-300 text-gray-700
           hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:outline-none
           transition-colors duration-200 cursor-pointer"

// Disabled Button
className="... disabled:cursor-not-allowed"
```

#### Cursor Guidelines
```jsx
// Interactive Elements
className="cursor-pointer"     // Buttons, clickable cards, tabs, menu items
className="cursor-text"        // Input fields, text areas, editable content
className="cursor-grab"        // Draggable items (normal state)
className="cursor-grabbing"    // Draggable items (while dragging)
className="cursor-not-allowed" // Disabled buttons, restricted actions
className="cursor-help"        // Help tooltips, info icons
className="cursor-wait"        // Loading states, processing actions
className="cursor-default"     // Non-interactive content (default browser cursor)

// Common Use Cases
- Buttons: cursor-pointer (enabled), cursor-not-allowed (disabled)
- Links: cursor-pointer
- Form inputs: cursor-text (automatically applied to input/textarea)
- Clickable cards: cursor-pointer
- Icons with actions: cursor-pointer
- Loading overlays: cursor-wait
- Drag handles: cursor-grab/cursor-grabbing
```

#### Layout Elements
```jsx
// Cards (Mobile-responsive)
className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6"

// Containers
className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6"

// Typography - Large Headings
className="text-lg font-bold text-gray-900 mb-2 sm:text-xl sm:mb-3"

// Typography - Body Text
className="text-sm text-gray-600 leading-relaxed sm:text-base"

// Alerts
className="p-3 rounded-md border text-sm bg-blue-50 border-blue-200 text-blue-800" // Info
className="p-3 rounded-md border text-sm bg-red-50 border-red-200 text-red-800"   // Error
```

### Color Palette
- **Primary**: blue-600, blue-700 (buttons, focus states)
- **Success**: green-600, green-50
- **Warning**: yellow-600, yellow-50  
- **Error**: red-600, red-50
- **Neutral**: gray-900, gray-700, gray-600, gray-300, gray-200

### Spacing System
- **Form spacing**: mb-3, space-y-3 (compact)
- **Touch targets**: 36px minimum height
- **Padding**: px-3 py-1.5 (consistent for inputs/buttons)
- **Responsive**: Scale up on larger screens (sm:, lg:)

## CURRENT ARCHITECTURE

### Project Structure
```
smartlias/
├── frontend/             # Next.js React Application (Port 3000)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/       # Next.js app directory (routes)
│   │   ├── layouts/     # Page layout components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API communication layer
│   │   ├── lib/         # Frontend utilities & auth
│   │   ├── data/        # Sample JSON data (demo)
│   │   └── styles/      # CSS and styling
│   ├── package.json     # Frontend dependencies
│   └── .env.development # Frontend environment variables
│
├── backend/              # Express.js API Server (Port 5000)
│   ├── routes/          # API route definitions
│   ├── controllers/     # Business logic handlers
│   ├── models/          # Data models and schema
│   ├── middleware/      # Auth, logging, error handlers
│   ├── config/          # Configuration files
│   ├── utils/           # Helper functions
│   ├── server.js        # Application entry point
│   ├── package.json     # Backend dependencies
│   └── .env.development # Backend environment variables
│
├── Makefile            # Development commands
├── WIKI.md             # Architecture documentation
└── README.md           # Project documentation
```

### Environment Configuration
- **Separate .env.development files** for frontend and backend services
- **Frontend** uses `frontend/.env.development` with NEXT_PUBLIC_ variables and NODE_ENV
- **Backend** uses `backend/.env.development` with server configuration and secrets
- **No file copying** - each service loads its own environment file

### Development Workflow
```bash
make dev              # Start both frontend (3000) & backend (5000)
make dev-frontend     # Start only frontend
make dev-backend      # Start only backend
make setup           # Install all dependencies
make clean           # Clean build files and copied env
```

## DEVELOPMENT STANDARDS & PATTERNS
> **CRITICAL**: Apply these patterns consistently across ALL features

### PROJECT GUIDELINES

#### Documentation Standards
- **NO EMOJIS**: Never use emojis in documentation, comments, or code
- **NO EMOTICONS**: Never use emoticons or decorative symbols in code changes
- **Clean Text**: Use clear, professional language without decorative symbols
- **Consistent Format**: Maintain consistent formatting across all files
- **Professional Tone**: Keep all documentation business-appropriate
- **Demo Comments**: All demo/temporary code must be marked with `// Demo:` for easy identification

### UI/UX Design Standards

#### Validation Pattern (MANDATORY for all forms)
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

#### Input Sanitization (REQUIRED everywhere)
```javascript
const sanitizeInput = (input) => {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove XSS characters
    .slice(0, 100)           // Prevent buffer overflow
}
```

#### Toast Notification Usage Rules
- **Use toasts for**: Server responses, network errors, success messages
- **Don't use toasts for**: Field validation errors (use inline errors)
- **Color coding**: error (red), success (green), info (blue), warning (amber)

#### Form Design Standards
- Inline field validation with red borders and error text
- Consistent error states: `border-red-300 focus:border-red-500`
- Loading states with spinner and disabled buttons
- Responsive design with mobile-first approach

### Code Architecture Standards

#### Frontend Validation Template
```javascript
const [errors, setErrors] = useState({})

const handleInputChange = (e) => {
  const { name, value } = e.target
  setFormData(prev => ({ ...prev, [name]: value }))
  
  // Clear error when user starts typing
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: '' }))
  }
}

const validateForm = () => {
  const newErrors = {}
  // Add validation logic here
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

#### Backend Validation Template
```javascript
// Always validate on backend too
const sanitizeInput = (input) => {
  return input?.trim()?.replace(/[<>'"&]/g, '')?.slice(0, 100) || ''
}

const validateInputs = (data) => {
  const errors = []
  // Mirror frontend validation rules
  return errors
}
```

## Technology Stack

### Frontend (Next.js Application)
- **Framework**: Next.js 15+ with App Router
- **UI Library**: React 19+
- **Styling**: Tailwind CSS 4+
- **Authentication**: Client-side session management with localStorage (current)
- **State Management**: React hooks and context
- **HTTP Client**: Fetch API for backend communication
- **Icons**: Bootstrap Icons v1.11.3
- **Notifications**: Custom toast system

### Backend (Express.js API)
- **Framework**: Express.js 4+
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: Supabase (PostgreSQL)
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Custom input sanitization and validation
- **Environment**: dotenv for configuration
- **Middleware**: Authentication, error handling, logging

### Communication
- **Protocol**: HTTP/REST API
- **Format**: JSON
- **Base URL**: http://localhost:5000/api (development)
- **Authentication**: Bearer tokens in Authorization headers

## Current Architecture Plans

### Phase 1: Frontend-Only (COMPLETED)
- COMPLETED: Client-side authentication with localStorage
- COMPLETED: Sample JSON data for demonstration
- COMPLETED: Complete UI components and layouts
- COMPLETED: Role-based routing and access control

### Phase 2: Backend Integration (IN PROGRESS)
- IN PROGRESS: Express.js API server setup
- IN PROGRESS: Database integration with Supabase
- IN PROGRESS: JWT authentication system
- IN PROGRESS: RESTful API endpoints
- IN PROGRESS: Data migration from JSON to database

### Phase 3: Full-Stack Integration (PLANNED)
- PLANNED: Frontend API service layer
- PLANNED: Replace localStorage with API calls
- PLANNED: Real-time features with WebSocket
- PLANNED: File upload and management
- PLANNED: Advanced reporting features

### Authentication System Evolution

#### Current State (Frontend-Only)
```javascript
// Frontend authentication in lib/frontend-auth.js
const auth = {
  login: (username, password) => {
    // Validates against users.json
    // Stores session in localStorage
    // Returns user object with role
  },
  logout: () => {
    // Clears localStorage session
    // Redirects to login
  }
}
```

#### Target State (Full-Stack)
```javascript
// Frontend API service
const authAPI = {
  login: async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    // Handle JWT token storage
  }
}

// Backend authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  // Validate credentials against database
  // Generate JWT token
  // Return user data with token
})
```
1. User submits credentials at `/login`
2. Frontend validation + sanitization
3. Backend validation + sanitization  
4. JWT token created and stored in httpOnly cookie
5. Automatic session validation for subsequent requests

## API Design & Implementation Plan

### Backend API Endpoints (Planned)
```
POST   /api/auth/login          # User authentication
POST   /api/auth/logout         # Session termination
GET    /api/auth/me            # Get current user info
POST   /api/auth/change-password # Password update

GET    /api/residents          # List all residents
POST   /api/residents          # Create new resident
GET    /api/residents/:id      # Get resident details
PUT    /api/residents/:id      # Update resident
DELETE /api/residents/:id      # Delete resident

GET    /api/requests           # List service requests
POST   /api/requests           # Create new request
GET    /api/requests/:id       # Get request details
PUT    /api/requests/:id       # Update request status

GET    /api/admin/dashboard    # Admin dashboard data
GET    /api/admin/users        # User management
```

### Current Frontend Routes
```
/                    # Landing page (redirects based on auth)
/login              # Authentication page
/admin              # Admin dashboard
/admin/residents    # Resident management
/resident           # Resident dashboard
/change-password    # Password change form
```

### Security Implementation Plan
- **Authentication**: JWT tokens with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Joi/Yup schema validation
- **Rate Limiting**: Express-rate-limit for API protection
- **CORS**: Configured for frontend-backend communication
- **Helmet**: Security headers for Express application

### Middleware Protection
**File**: `middleware.js`
- Validates session cookies for all `/api/*` routes
- Excludes `/api/auth/*` routes from protection
- Adds user info to request headers (X-User-Id, X-User-Role, X-Username)
- Returns 401 for invalid sessions with clear error messages

### UI Components

#### Sidebar Navigation
**File**: `components/Sidebar.jsx`
- Responsive design (auto-collapse below 1024px)
- localStorage persistence for collapsed state
- Active state highlighting with path-based detection
- Floating toggle button with rotation animation
- Custom tooltips for collapsed state

#### Toast Notifications
**File**: `components/ToastNotification.js`
- Color-coded backgrounds and text based on message type
- Filled Bootstrap icons for better visibility
- Auto-dismiss functionality with configurable duration
- Wider layout (384px) for better readability
- Support for: info (blue), success (green), warning (amber), error (red)

#### Login Page
**File**: `app/login/page.js`
- Two-column responsive layout
- Hero section with barangay branding (desktop only)
- Comprehensive frontend validation with real-time feedback
- Input sanitization before submission
- Mobile-responsive with barangay logo and copyright

### API Security

#### Input Sanitization Functions:
```javascript
// Frontend & Backend
function sanitizeInput(input) {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove XSS characters
    .slice(0, 100)           // Prevent buffer overflow
}
```

#### Validation Functions:
- Username pattern validation: `/^[a-zA-Z0-9._-]+$/`
- Password minimum length: 6 characters
- Error collection and detailed feedback
- Security event logging for invalid attempts

## Data Storage
**Type**: JSON file-based system
- User data: `data/users.json`
- IP tracking: `data/ip-attempts.json`  
- Blocked IPs: `data/blocked-ips.json`
- No SQL database dependencies

## Security Considerations

### Current Protections:
- **XSS Prevention**: Input sanitization, React auto-escaping
- **Session Security**: httpOnly cookies, CSRF protection
- **Rate Limiting**: Account lockout mechanism
- **Input Validation**: Frontend + Backend validation
- **Security Logging**: Authentication events tracked
- **Path Traversal**: Absolute paths, sanitized inputs

### Not Applicable (JSON-based):
- **SQL Injection**: Not using SQL databases
- **Database Security**: File-based storage

## Bearer Token & API Key Analysis

### Current State: **Not Implemented**
We removed bearer token support in favor of session-based authentication.

### When You Might Need API Keys/Bearer Tokens:

#### External Integration Scenarios:
1. **Mobile Applications**
   - Native iOS/Android apps for residents
   - Would need API key authentication

2. **Government System Integration**
   - LGU reporting systems
   - Provincial/municipal data sharing
   - Inter-barangay coordination

3. **Third-party Services**
   - SMS gateways for notifications
   - Payment processors for fees
   - Document management systems

4. **Automation & Scripts**
   - Data backup scripts
   - Automated reporting tools
   - System monitoring services

5. **Microservices Architecture**
   - If system grows to multiple services
   - Service-to-service communication

### Implementation Options:

#### Option 1: Hybrid Authentication
```javascript
// Support both session cookies AND API keys
if (sessionValid || apiKeyValid) {
  // Allow access
}
```

#### Option 2: Separate API Endpoints
```
/api/internal/*  → Session-based (web app)
/api/external/*  → API key-based (integrations)
```

#### Option 3: Role-based API Access
```javascript
// Different API key permissions
const apiKeyRoles = {
  'read-only': ['GET'],
  'resident-access': ['GET', 'POST'],
  'admin-access': ['GET', 'POST', 'PUT', 'DELETE']
}
```

### Recommendation:
**For current barangay web portal**: Session-based authentication is perfect and more secure.

**Consider API keys when you need**:
- Mobile app development
- External system integrations  
- Automated tools/scripts
- Third-party service connections

## Development Notes

### Environment Variables:
```env
PASSWORD_SALT=your-jwt-secret-here
APP_ENV=development
APP_URL=http://localhost:3000
```

### File Structure:
```
app/
├── page.js                 → Smart router homepage
├── login/page.js          → Login page with validation
├── admin/page.js          → Admin dashboard
├── resident/page.js       → Resident dashboard
├── api/auth/login/route.js → Authentication endpoint
├── api/auth/logout/route.js → Logout endpoint
└── middleware.js          → Session validation

components/
├── Sidebar.jsx            → Responsive navigation
└── ToastNotification.js   → Color-coded notifications

lib/
├── auth.js               → JWT utilities
└── config.js             → App configuration
```

### Next Steps for API Key Implementation:
If external access is needed:

1. **Create API key management system**
2. **Add hybrid authentication middleware**  
3. **Implement role-based API access**
4. **Add API key generation/rotation**
5. **Document API endpoints for external use**

---

## DEVELOPMENT CHECKLIST
> **Use this checklist for EVERY new feature/form you build**

### Before Starting New Features:
- [ ] Read this context.md file completely
- [ ] Reference login/page.js as validation pattern example
- [ ] Copy sanitization functions from existing code
- [ ] Follow toast notification rules (no validation toasts)

### For Admin Dashboard Development:
- [ ] Apply same validation patterns as login page
- [ ] Use inline field errors (not toast notifications)
- [ ] Implement sanitization on both frontend + backend
- [ ] Follow responsive design patterns from login
- [ ] Use consistent color schemes and styling
- [ ] Add loading states for all async operations

### Quality Assurance:
- [ ] Test validation on both frontend and backend
- [ ] Verify sanitization prevents XSS
- [ ] Check mobile responsiveness
- [ ] Ensure consistent error messaging
- [ ] Validate accessibility with screen readers

## HOW TO REFERENCE THESE STANDARDS

### When Starting Admin Dashboard:
```bash
# 1. Always reference this file first
cat context.md

# 2. Copy validation patterns from login
cp app/login/page.js reference-validation-pattern.js

# 3. Follow the same structure for all forms
```

### Key Files to Reference:
- **`app/login/page.js`** → Perfect validation example
- **`components/ToastNotification.js`** → Notification standards  
- **`app/api/auth/login/route.js`** → Backend validation pattern
- **`context.md`** → This file for all standards

### Code Snippets to Reuse:
- Sanitization functions (copy exactly)
- Validation patterns (adapt field rules)
- Toast usage (server responses only)
- Error state styling (consistent colors)

---

## DEVELOPMENT PRIORITIES (September 2025)

### Immediate Tasks (Sprint 1)
1. **Backend API Development**
   - COMPLETED: Express.js server setup complete
   - IN PROGRESS: Implement authentication endpoints (/api/auth/*)
   - PLANNED: Create residents management API (/api/residents/*)
   - PLANNED: Set up Supabase database integration
   - PLANNED: Implement middleware for JWT validation

2. **Frontend API Integration**
   - PLANNED: Create API service layer in `/frontend/src/services/`
   - PLANNED: Replace frontend-auth.js with API calls
   - PLANNED: Update components to use backend APIs
   - PLANNED: Implement loading states and error handling

3. **Database Schema Design**
   - PLANNED: Users table (authentication)
   - PLANNED: Residents table (management)
   - PLANNED: Requests table (service requests)
   - PLANNED: Sessions table (authentication tracking)

### Medium-term Goals (Sprint 2-3)
- **File Upload System**: Document and image management
- **Real-time Features**: Live notifications and updates
- **Advanced Reporting**: Data analytics and charts
- **Mobile Optimization**: PWA capabilities
- **Testing Suite**: Unit and integration tests

### Technical Debt & Improvements
- **TypeScript Migration**: Gradual adoption for better type safety
- **State Management**: Consider Redux/Zustand for complex state
- **Performance**: Code splitting and lazy loading
- **Security**: Security audit and penetration testing

### Development Guidelines
- **Branch Strategy**: feature/backend-api, feature/frontend-integration
- **Code Review**: All PRs require review before merge
- **Testing**: Write tests for all new API endpoints
- **Documentation**: Update WIKI.md with architecture changes

### Key Files to Reference:
- **`WIKI.md`** → Architecture documentation for thesis defense
- **`README.md`** → Setup and development instructions
- **`.env.example`** → Environment configuration template
- **`Makefile`** → Development workflow commands
- **`context.md`** → This file for development standards

---

**Last Updated**: September 5, 2025  
**Current Phase**: Backend API Development & Integration  
**Architecture**: Separated Frontend (Next.js) + Backend (Express.js)  
**Environment**: Single .env file approach implemented  
**Development Status**: COMPLETED: Project restructured, IN PROGRESS: API development in progress
