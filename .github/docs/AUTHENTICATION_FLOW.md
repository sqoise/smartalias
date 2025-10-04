# SMARTLIAS - Authentication & Authorization Flow

**Complete Developer Guide: Login to Dashboard Navigation**

---

## 📚 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [JWT Token Authentication](#jwt-token-authentication)
4. [Complete Login Flow](#complete-login-flow)
5. [Password Change Flow](#password-change-flow)
6. [Login Security & Account Lockout](#login-security--account-lockout)
7. [Role-Based Access Control](#role-based-access-control)
8. [Session Management](#session-management)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Code Examples](#code-examples)

---

## 🎯 SYSTEM OVERVIEW

### **Authentication Architecture**

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   FRONTEND      │  HTTP   │     BACKEND      │  SQL    │   DATABASE   │
│   (Next.js)     │<------->│   (Express.js)   │<------->│ (PostgreSQL) │
│   Port 3000     │  REST   │   Port 9000      │         │              │
└─────────────────┘         └──────────────────┘         └──────────────┘
```

### **Key Technologies**

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL 16 (Docker local), Supabase (production)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs (12 rounds)
- **Session Duration**: 24 hours (configurable)
- **Security**: Rate limiting, input sanitization, account lockout

---

## 🗄️ DATABASE SCHEMA

### **Users Table Structure**

```sql
CREATE TABLE users (
    -- Identity
    id SERIAL PRIMARY KEY,
    username VARCHAR(256) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,              -- Bcrypt hashed
    role INTEGER DEFAULT 3,                      -- 1=Admin, 2=Staff, 3=Resident
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Password Change Tracking
    is_password_changed INTEGER DEFAULT 0,       -- 0=Must change, 1=Already changed
    
    -- Login Security
    failed_login_attempts INTEGER DEFAULT 0,     -- Increments on wrong PIN
    locked_until TIMESTAMP DEFAULT NULL,         -- Account lock timestamp
    last_login TIMESTAMP DEFAULT NULL,           -- Last successful login
    last_failed_login TIMESTAMP DEFAULT NULL     -- Last failed attempt
);
```

### **Column Explanations**

#### **is_password_changed** (Critical Column)
- **Purpose**: Forces users to change default/generated PINs
- **Values**:
  - `0` = Must change password (admin-created accounts, password resets)
  - `1` = Password already changed (self-registration, user-chosen PIN)

**Use Cases**:
1. **Self-Registration**: User creates account → `is_password_changed = 1`
2. **Admin Creates User**: Admin generates PIN → `is_password_changed = 0` → User forced to change on first login
3. **Admin Resets Password**: Admin resets PIN → `is_password_changed = 0` → User forced to change on next login

#### **failed_login_attempts & locked_until**
- **Purpose**: Prevent brute-force attacks
- **Logic**:
  - Increments by 1 on each failed login
  - Locks account for 15 minutes after 10 failed attempts
  - Resets to 0 on successful login
  - Auto-unlocks when current time > `locked_until`

---

## 🔐 JWT TOKEN AUTHENTICATION

### **What is JWT?**

JWT (JSON Web Token) is a self-contained token that stores user information securely.

**Token Structure**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInVzZXJuYW1lIjoiYWRtaW4ua2FwaXRhbiIsInJvbGUiOjEsImlhdCI6MTcyODAyODgwMCwiZXhwIjoxNzI4MTE1MjAwfQ.xW8vB5YQ6nX9Z2kL3mP7tR4sJ1aH6dC2fE8gK9iN0oP

[HEADER].[PAYLOAD].[SIGNATURE]
```

**Decoded Payload**:
```json
{
  "userId": 6,
  "username": "admin.kapitan",
  "role": 1,
  "iat": 1728028800,  // Issued at (Unix timestamp)
  "exp": 1728115200   // Expires at (Unix timestamp)
}
```

### **JWT as Session Mechanism**

| Traditional Sessions | JWT Tokens |
|---------------------|------------|
| Stored on server | Stored on client (localStorage) |
| Server memory required | Stateless (no server memory) |
| Can be revoked instantly | Cannot be revoked (until expiration) |
| Database lookup per request | No database lookup needed |

### **Token Lifecycle**

```
[User Logs In]
     ↓
Generate JWT token (expires in 24h)
     ↓
Send token to frontend
     ↓
Frontend stores in localStorage
     ↓
[User Browses Application]
     ↓
Every request includes token in header:
Authorization: Bearer <token>
     ↓
Backend verifies token signature & expiration
     ↓
If valid → Allow access
If expired → 403 Forbidden (user must re-login)
If invalid → 401 Unauthorized
     ↓
[User Logs Out OR 24h Passes]
     ↓
Remove token from localStorage
     ↓
User must login again
```

### **Token Security**

1. **Signature**: Token is cryptographically signed with `JWT_SECRET` from `.env`
2. **Expiration**: Token expires after 24 hours (configurable via `JWT_EXPIRES_IN`)
3. **Cannot be Forged**: Without `JWT_SECRET`, tokens cannot be created or modified
4. **Self-Validating**: Backend verifies signature without database lookup

---

## 🔄 COMPLETE LOGIN FLOW

### **Step-by-Step Process**

#### **STEP 1: User Enters Credentials**

```
User opens: http://localhost:3000/login
     ↓
User enters:
  - Username: "admin.kapitan"
  - PIN: "123456" (6-digit PIN)
     ↓
Frontend sends POST request to backend
```

**Frontend Code** (`app/login/page.js`):
```javascript
const handlePinSubmit = async (submittedPin) => {
  const loginResult = await apiClient.login(username, submittedPin)
  
  if (loginResult.success) {
    // Store token and user data
    localStorage.setItem('token', loginResult.data.token)
    localStorage.setItem('user', JSON.stringify(loginResult.data.user))
    
    // Check if password change required
    if (loginResult.data.user.requirePasswordChange) {
      router.push('/change-pin')  // Force PIN change
    } else {
      // Redirect based on role
      if (loginResult.data.user.role === 1) {
        router.push('/admin')  // Admin dashboard
      } else if (loginResult.data.user.role === 3) {
        router.push('/resident')  // Resident dashboard
      }
    }
  }
}
```

#### **STEP 2: Backend Receives Login Request**

**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin.kapitan",
  "pin": "123456"
}
```

**Backend Processing** (`backend/router.js`):
```javascript
router.post('/auth/login', authLimiter, async (req, res) => {
  const { username, pin } = req.body
  
  // 1. Sanitize inputs
  const sanitizedUsername = sanitizeInput(username)
  const sanitizedPin = sanitizeInput(pin)
  
  // 2. Find user in database
  const user = await UserRepository.findByUsername(sanitizedUsername)
  
  if (!user) {
    // User doesn't exist - return generic error
    return ApiResponse.unauthorized(res, 'Invalid username or PIN')
  }
  
  // 3. Check if account is locked
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    const minutesLeft = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000)
    return ApiResponse.error(res, `Account locked. Try again in ${minutesLeft} minutes.`, 423)
  }
  
  // 4. Verify PIN (bcrypt comparison)
  const isValidPin = await bcrypt.compare(pin.toString(), user.passwordHash)
  
  if (!isValidPin) {
    // Wrong PIN - increment failed attempts
    const failedAttempts = (user.failedLoginAttempts || 0) + 1
    let lockedUntil = null
    
    // Lock account if 10 failed attempts
    if (failedAttempts >= config.MAX_LOGIN_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + config.LOCKOUT_TIME).toISOString()
      logger.warn('Account locked due to failed attempts', { username, attempts: failedAttempts })
    }
    
    await UserRepository.updateLoginFailure(user.id, username, failedAttempts, lockedUntil)
    return ApiResponse.unauthorized(res, 'Invalid PIN. Please try again.')
  }
  
  // 5. Successful login - Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }  // 24 hours
  )
  
  // 6. Update login tracking
  await UserRepository.updateLoginSuccess(user.id, username)
  
  // 7. Check if password change required
  const requirePasswordChange = user.isPasswordChanged === 0
  
  // 8. Send response
  return ApiResponse.success(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      requirePasswordChange  // Frontend checks this flag
    }
  }, 'Login successful')
})
```

#### **STEP 3: Database Updates on Successful Login**

```sql
-- Backend executes this SQL
UPDATE users 
SET 
  failed_login_attempts = 0,      -- Reset failed attempts counter
  locked_until = NULL,            -- Unlock account
  last_login = NOW(),             -- Record login timestamp
  updated_at = NOW()
WHERE id = 6;
```

**Result**:
```sql
-- Before login
failed_login_attempts = 3
locked_until = NULL
last_login = '2025-10-03 07:53:24'

-- After login
failed_login_attempts = 0           -- ← Reset
locked_until = NULL
last_login = '2025-10-04 08:30:15'  -- ← Updated
```

#### **STEP 4: Frontend Receives Token**

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 6,
      "username": "admin.kapitan",
      "role": 1,
      "firstName": "Juan",
      "lastName": "Kapitan",
      "requirePasswordChange": false
    }
  },
  "message": "Login successful"
}
```

**Frontend stores token**:
```javascript
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
localStorage.setItem('user', JSON.stringify({ id: 6, username: "admin.kapitan", role: 1 }))
```

#### **STEP 5: Navigation Based on Role & Password Status**

**Decision Tree**:
```
requirePasswordChange === true?
  ↓
  YES → Redirect to /change-pin
  |
  NO → Check role:
       ├─ role === 1 (Admin) → Redirect to /admin
       ├─ role === 2 (Staff) → Redirect to /staff
       └─ role === 3 (Resident) → Redirect to /resident
```

**Frontend Logic**:
```javascript
if (loginResult.data.user.requirePasswordChange) {
  // User must change PIN first
  router.push('/change-pin')
} else {
  // Normal navigation based on role
  switch (loginResult.data.user.role) {
    case 1:
      router.push('/admin')      // Admin Dashboard
      break
    case 2:
      router.push('/staff')      // Staff Dashboard  
      break
    case 3:
      router.push('/resident')   // Resident Dashboard
      break
    default:
      router.push('/home')       // Fallback
  }
}
```

#### **STEP 6: Protected Pages Use Token**

Every protected page sends the token with requests:

**Frontend API Call**:
```javascript
// User navigates to /admin/residents
const response = await fetch('http://localhost:9000/api/residents', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`  // ← Token included
  }
})
```

**Backend Middleware** (`authMiddleware.js`):
```javascript
const authenticateToken = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' })
  }
  
  // Verify token
  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Token expired or invalid
      return res.status(403).json({ success: false, error: 'Invalid or expired token' })
    }
    
    // Token valid - attach user to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    }
    
    next()  // Continue to route handler
  })
}
```

---

## 🔄 PASSWORD CHANGE FLOW

### **When is PIN Change Required?**

1. **Admin creates resident account** → `is_password_changed = 0`
2. **Admin resets user password** → `is_password_changed = 0`
3. **User self-registers** → `is_password_changed = 1` (no change required)

### **Complete Change PIN Flow**

#### **STEP 1: User Forced to Change PIN Page**

```
User logs in with admin-generated PIN
     ↓
Backend returns: requirePasswordChange = true
     ↓
Frontend redirects to: /change-pin
     ↓
User sees PIN change form
```

#### **STEP 2: User Submits New PIN**

**Frontend** (`app/change-pin/page.js`):
```javascript
const handleChangePIN = async () => {
  const result = await apiClient.changePassword(currentPin, newPin)
  
  if (result.success) {
    // PIN changed successfully
    // Redirect to dashboard based on role
    if (user.role === 1) {
      router.push('/admin')
    } else if (user.role === 3) {
      router.push('/resident')
    }
  }
}
```

**Backend** (`backend/router.js`):
```javascript
router.post('/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const username = req.user.username
  
  // 1. Get user from database
  const user = await UserRepository.findByUsername(username)
  
  // 2. Verify current password
  const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)
  
  if (!passwordMatch) {
    return ApiResponse.unauthorized(res, 'Current password is incorrect')
  }
  
  // 3. Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS)
  
  // 4. Update password and mark as changed
  await UserRepository.updatePassword(username, hashedPassword)
  
  return ApiResponse.success(res, null, 'Password changed successfully')
})
```

#### **STEP 3: Database Update**

```sql
UPDATE users 
SET 
  password = '$2a$12$newHashedPassword...',  -- New PIN hashed
  is_password_changed = 1,                   -- Mark as changed
  updated_at = NOW()
WHERE username = 'admin.kapitan';
```

#### **STEP 4: User Can Now Access Dashboard**

```
PIN changed successfully
     ↓
is_password_changed = 1
     ↓
On next login: requirePasswordChange = false
     ↓
User goes directly to dashboard (no forced PIN change)
```

---

## 🔒 LOGIN SECURITY & ACCOUNT LOCKOUT

### **Configuration**

```javascript
// backend/config/config.js
MAX_LOGIN_ATTEMPTS: 10        // Lock account after 10 failed attempts
LOCKOUT_TIME: 900000          // 15 minutes (in milliseconds)
```

### **Failed Login Flow**

```
Attempt 1-9: Wrong PIN entered
     ↓
Backend increments: failed_login_attempts += 1
Backend updates: last_failed_login = NOW()
Backend returns: "Invalid PIN. Please try again."
     ↓
User can try again immediately
     ↓
Attempt 10: Wrong PIN entered
     ↓
Backend sets: failed_login_attempts = 10
Backend sets: locked_until = NOW() + 15 minutes
Backend returns: "Account locked. Try again in 15 minutes."
     ↓
User cannot login (even with correct PIN)
     ↓
After 15 minutes:
Backend checks: NOW() > locked_until? → YES
Backend allows: Login attempt proceeds normally
Backend resets: failed_login_attempts = 0, locked_until = NULL
```

### **Security Features**

1. **Rate Limiting**: 5 login attempts per 15 minutes per IP address
2. **Account Lockout**: 10 failed attempts = 15-minute lockout
3. **Auto-Unlock**: Account automatically unlocks after lockout period
4. **No User Enumeration**: Same error message for wrong username or wrong PIN
5. **Input Sanitization**: All inputs sanitized to prevent XSS attacks
6. **Bcrypt Hashing**: 12 rounds of hashing (2^12 = 4096 iterations)

---

## 👥 ROLE-BASED ACCESS CONTROL

### **User Roles**

| Role ID | Role Name | Dashboard Route | Access Level |
|---------|-----------|----------------|--------------|
| 1 | Admin | `/admin` | Full access (CRUD residents, view logs, manage users) |
| 2 | Staff | `/staff` | Limited access (view residents, process requests) |
| 3 | Resident | `/resident` | Personal access (view own info, submit requests) |

### **Backend Authorization Middleware**

```javascript
// authMiddleware.js

// Require Admin Role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 1) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    })
  }
  next()
}

// Require Staff or Admin
const requireStaff = (req, res, next) => {
  if (req.user.role !== 1 && req.user.role !== 2) {
    return res.status(403).json({
      success: false,
      error: 'Staff access required'
    })
  }
  next()
}

// Usage in routes
router.post('/residents', authenticateToken, requireAdmin, async (req, res) => {
  // Only admins can create residents
})

router.get('/residents', authenticateToken, async (req, res) => {
  // All authenticated users can view residents
})
```

### **Frontend Route Protection**

```javascript
// components/authenticated/DashboardLayout.jsx

useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')
  
  if (!token || !user) {
    // Not logged in
    router.push('/login')
    return
  }
  
  // Check role-based access
  const currentPath = window.location.pathname
  
  if (currentPath.startsWith('/admin') && user.role !== 1) {
    // User is not admin, trying to access admin pages
    router.push('/forbidden')
  }
  
  if (currentPath.startsWith('/staff') && user.role !== 2 && user.role !== 1) {
    // User is not staff or admin
    router.push('/forbidden')
  }
  
  if (currentPath.startsWith('/resident') && user.role !== 3) {
    // User is not resident
    router.push('/forbidden')
  }
}, [])
```

---

## ⏰ SESSION MANAGEMENT

### **Token Expiration = Session Duration**

```javascript
// Token created at login
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })

// Token payload includes expiration
{
  userId: 6,
  username: "admin.kapitan",
  role: 1,
  iat: 1728028800,  // Issued at: Oct 4, 2025 8:00 AM
  exp: 1728115200   // Expires: Oct 5, 2025 8:00 AM (24 hours later)
}
```

### **Session Behavior**

**Normal Session**:
```
8:00 AM - User logs in → Gets 24h token
2:00 PM - User accesses pages → Token valid ✓
7:00 PM - User closes browser → Token still in localStorage
Next day 7:00 AM - User opens browser → Token still valid ✓
Next day 8:01 AM - Token expired → Must re-login ❌
```

**Session Expiration While Working**:
```
User working on dashboard
     ↓
24 hours pass
     ↓
User makes API request
     ↓
Backend: jwt.verify() → Error: "jwt expired"
     ↓
Backend returns: 403 Forbidden
     ↓
Frontend receives 403
     ↓
Frontend redirects to /login
     ↓
User must enter credentials again
```

### **Logout Flow**

```javascript
// Frontend logout
const logout = () => {
  // Remove token and user data
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  
  // Optional: Call backend logout endpoint for logging
  fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  // Redirect to login
  router.push('/login')
}
```

**Backend Logout** (optional, for logging only):
```javascript
router.post('/auth/logout', authenticateToken, (req, res) => {
  // JWT is stateless - logout just logs the event
  logger.info('User logged out', { username: req.user.username })
  
  return ApiResponse.success(res, null, 'Logout successful')
})
```

---

## 🔌 API ENDPOINTS REFERENCE

### **Authentication Endpoints**

#### **POST /api/auth/login**
- **Purpose**: User login
- **Auth**: Public
- **Rate Limit**: 5 requests per 15 minutes
- **Request**:
  ```json
  {
    "username": "admin.kapitan",
    "pin": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 6,
        "username": "admin.kapitan",
        "role": 1,
        "firstName": "Juan",
        "lastName": "Kapitan",
        "requirePasswordChange": false
      }
    },
    "message": "Login successful"
  }
  ```

#### **POST /api/auth/logout**
- **Purpose**: User logout (logging only)
- **Auth**: Required (JWT)
- **Request**: No body
- **Response**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "Logout successful"
  }
  ```

#### **POST /api/auth/change-password**
- **Purpose**: Change user password/PIN
- **Auth**: Required (JWT)
- **Request**:
  ```json
  {
    "currentPassword": "123456",
    "newPassword": "654321"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "Password changed successfully"
  }
  ```

#### **POST /api/auth/check-user**
- **Purpose**: Check if username exists (for login page)
- **Auth**: Public
- **Request**:
  ```json
  {
    "username": "admin.kapitan"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "exists": true,
      "user": {
        "username": "admin.kapitan",
        "firstName": "Juan",
        "lastName": "Kapitan"
      }
    },
    "message": "User found"
  }
  ```

### **Protected Endpoints (Require JWT)**

#### **GET /api/residents**
- **Purpose**: List all residents
- **Auth**: Required (JWT)
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `page`, `limit`, `search`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "residents": [...],
      "pagination": {
        "total": 100,
        "page": 1,
        "limit": 20,
        "totalPages": 5
      }
    },
    "message": "Residents retrieved successfully"
  }
  ```

#### **POST /api/residents** (Admin Only)
- **Purpose**: Create new resident
- **Auth**: Required (JWT) + Admin role
- **Headers**: `Authorization: Bearer <token>`
- **Request**:
  ```json
  {
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "middleName": "Santos",
    "birthDate": "1990-01-01",
    "civilStatus": "Single",
    "address": "B1 L1 Burgos St",
    "contactNumber": "09123456789",
    "email": "juan@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Dela Cruz",
      ...
    },
    "message": "Resident created successfully"
  }
  ```

---

## 💻 CODE EXAMPLES

### **Frontend: API Client**

```javascript
// lib/apiClient.js
const API_BASE_URL = 'http://localhost:9000/api'

const apiClient = {
  // Login
  async login(username, pin) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin })
    })
    return await response.json()
  },
  
  // Get residents (authenticated)
  async getResidents(page = 1, limit = 20) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/residents?page=${page}&limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.status === 403) {
      // Token expired - redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return
    }
    
    return await response.json()
  },
  
  // Change password
  async changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    })
    return await response.json()
  }
}

export default apiClient
```

### **Backend: User Repository**

```javascript
// models/userRepository.js
const db = require('../config/db')
const bcrypt = require('bcryptjs')

class UserRepository {
  // Find user by username
  static async findByUsername(username) {
    const result = await db.query(
      `SELECT 
        id, 
        username, 
        password, 
        role,
        is_password_changed,
        failed_login_attempts,
        locked_until,
        last_login,
        last_failed_login
      FROM users 
      WHERE username = $1`,
      [username]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const user = result.rows[0]
    return {
      id: user.id,
      username: user.username,
      passwordHash: user.password,
      role: user.role,
      isPasswordChanged: user.is_password_changed,
      failedLoginAttempts: user.failed_login_attempts,
      lockedUntil: user.locked_until,
      lastLogin: user.last_login,
      lastFailedLogin: user.last_failed_login
    }
  }
  
  // Update login failure
  static async updateLoginFailure(userId, username, failedAttempts, lockedUntil) {
    await db.query(
      `UPDATE users 
       SET failed_login_attempts = $1, 
           locked_until = $2, 
           last_failed_login = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [failedAttempts, lockedUntil, userId]
    )
  }
  
  // Update login success
  static async updateLoginSuccess(userId, username) {
    await db.query(
      `UPDATE users 
       SET failed_login_attempts = 0, 
           locked_until = NULL, 
           last_login = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    )
  }
  
  // Update password
  static async updatePassword(username, hashedPassword) {
    await db.query(
      `UPDATE users 
       SET password = $1, 
           is_password_changed = 1,
           updated_at = NOW()
       WHERE username = $2`,
      [hashedPassword, username]
    )
  }
}

module.exports = UserRepository
```

---

## 📊 COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SMARTLIAS AUTHENTICATION FLOW                    │
└─────────────────────────────────────────────────────────────────────┘

                         [USER VISITS /login]
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  Enter Username & PIN   │
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   Frontend: Submit      │
                     │   POST /api/auth/login  │
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  Backend: Find User     │
                     │  in Database            │
                     └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌──────────────────┐      ┌──────────────────┐
          │  User Not Found  │      │   User Found     │
          └──────────────────┘      └──────────────────┘
                    │                           │
                    │                           ▼
                    │              ┌─────────────────────────┐
                    │              │  Check Account Locked?  │
                    │              └─────────────────────────┘
                    │                           │
                    │              ┌────────────┴────────────┐
                    │              │                         │
                    │              ▼                         ▼
                    │    ┌──────────────────┐    ┌──────────────────┐
                    │    │  Account Locked  │    │  Account Active  │
                    │    └──────────────────┘    └──────────────────┘
                    │              │                         │
                    │              │                         ▼
                    │              │           ┌─────────────────────────┐
                    │              │           │  Verify PIN (bcrypt)    │
                    │              │           └─────────────────────────┘
                    │              │                         │
                    │              │           ┌─────────────┴─────────────┐
                    │              │           │                           │
                    │              │           ▼                           ▼
                    │              │  ┌──────────────────┐      ┌──────────────────┐
                    │              │  │   Wrong PIN      │      │   Correct PIN    │
                    │              │  └──────────────────┘      └──────────────────┘
                    │              │           │                           │
                    │              │           ▼                           ▼
                    │              │  ┌──────────────────┐      ┌──────────────────┐
                    │              │  │ Increment Failed │      │  Generate JWT    │
                    │              │  │    Attempts      │      │     Token        │
                    │              │  └──────────────────┘      └──────────────────┘
                    │              │           │                           │
                    │              │           │                           ▼
                    │              │           │              ┌─────────────────────────┐
                    │              │           │              │  Update Last Login      │
                    │              │           │              │  Reset Failed Attempts  │
                    │              │           │              └─────────────────────────┘
                    │              │           │                           │
                    │              │           ▼                           ▼
                    │              │  ┌──────────────────┐      ┌──────────────────┐
                    │              │  │  Check: 10th     │      │  Return Token    │
                    │              │  │   Attempt?       │      │  & User Data     │
                    │              │  └──────────────────┘      └──────────────────┘
                    │              │           │                           │
                    │              │  ┌────────┴────────┐                 │
                    │              │  │                 │                 │
                    │              │  ▼                 ▼                 │
                    │              │ YES               NO                 │
                    │              │  │                 │                 │
                    │              │  ▼                 │                 │
                    │              │ Lock               │                 │
                    │              │ Account            │                 │
                    │              │                    │                 │
                    ▼              ▼                    ▼                 ▼
          ┌──────────────────────────────────────────────────────────────┐
          │                     Return Error Response                     │
          │  - Invalid credentials                                        │
          │  - Account locked                                             │
          └──────────────────────────────────────────────────────────────┘
                                  │
                                  │              ┌──────────────────────────┐
                                  │              │    Return Success         │
                                  │              │    Response with Token    │
                                  │              └──────────────────────────┘
                                  │                           │
                                  ▼                           ▼
                     ┌─────────────────────────┐   ┌──────────────────────┐
                     │  Frontend: Show Error   │   │ Frontend: Store Token│
                     │  Message to User        │   │  in localStorage     │
                     └─────────────────────────┘   └──────────────────────┘
                                                              │
                                                              ▼
                                           ┌──────────────────────────────┐
                                           │  Check requirePasswordChange │
                                           └──────────────────────────────┘
                                                              │
                                           ┌──────────────────┴──────────────────┐
                                           │                                     │
                                           ▼                                     ▼
                              ┌─────────────────────┐            ┌─────────────────────┐
                              │  is_password_       │            │  is_password_       │
                              │  changed === 0      │            │  changed === 1      │
                              └─────────────────────┘            └─────────────────────┘
                                           │                                     │
                                           ▼                                     ▼
                              ┌─────────────────────┐            ┌─────────────────────┐
                              │  Redirect to        │            │  Check User Role    │
                              │  /change-pin        │            └─────────────────────┘
                              └─────────────────────┘                        │
                                           │                  ┌───────────────┼───────────────┐
                                           │                  │               │               │
                                           │                  ▼               ▼               ▼
                                           │         ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                                           │         │  role === 1 │ │  role === 2 │ │  role === 3 │
                                           │         │   (Admin)   │ │   (Staff)   │ │ (Resident)  │
                                           │         └─────────────┘ └─────────────┘ └─────────────┘
                                           │                  │               │               │
                                           │                  ▼               ▼               ▼
                                           │         ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                                           │         │  /admin     │ │  /staff     │ │ /resident   │
                                           │         │  Dashboard  │ │  Dashboard  │ │  Dashboard  │
                                           │         └─────────────┘ └─────────────┘ └─────────────┘
                                           │
                                           ▼
                              ┌─────────────────────┐
                              │  User Changes PIN   │
                              └─────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────┐
                              │  Update Database:   │
                              │  is_password_       │
                              │  changed = 1        │
                              └─────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────┐
                              │  Redirect to        │
                              │  Dashboard Based    │
                              │  on Role            │
                              └─────────────────────┘
```

---

## 🎯 SUMMARY

### **Key Takeaways**

1. **JWT Tokens**: Stateless authentication - token contains all user info, no server-side session storage
2. **Token = Session**: Token expiration (24h) acts as session duration
3. **Password Change Flag**: `is_password_changed` column forces users to change default/generated PINs
4. **Account Lockout**: 10 failed attempts = 15-minute lockout (prevents brute force)
5. **Role-Based Navigation**: Admin → `/admin`, Staff → `/staff`, Resident → `/resident`
6. **Security Layers**: Rate limiting, input sanitization, bcrypt hashing, JWT signatures

### **Developer Checklist**

- ✅ Understand JWT token structure and lifecycle
- ✅ Know when `is_password_changed = 0` vs `1`
- ✅ Implement proper token storage (localStorage)
- ✅ Handle token expiration (403 errors → redirect to login)
- ✅ Use `authenticateToken` middleware for protected routes
- ✅ Use `requireAdmin` middleware for admin-only routes
- ✅ Check `requirePasswordChange` flag on login response
- ✅ Navigate users based on role after successful login
- ✅ Clear tokens on logout
- ✅ Test account lockout behavior (10 failed attempts)

---

**Document Version**: 1.0  
**Last Updated**: October 4, 2025  
**Author**: SMARTLIAS Development Team
