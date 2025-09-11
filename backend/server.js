// =============================================================================
// SIMPLE AUTHENTICATION SYSTEM - Student-Friendly Version
// =============================================================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Using bcryptjs (already installed)
const jwt = require('jsonwebtoken');
const path = require('path');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

const app = express();
const PORT = process.env.PORT || 9000; // Backend on port 9000, frontend on port 3000

// JWT Secret (in production, use a strong secret from environment)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';
const JWT_SECRET_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

// Simple middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// =============================================================================
// SIMPLE IN-MEMORY USER DATABASE (for demo/development)
// Students: Replace this with real database later
// =============================================================================

// Role constants for faster comparison
const ROLE_TYPES = {
  RESIDENT: 1,
  ADMIN: 2
}

let users = [
  {
    id: 1,
    username: 'admin.staff',
    passwordHash: bcrypt.hashSync('010180', 10), // MPIN: 010180
    role: ROLE_TYPES.ADMIN, // Using numeric role ID
    failedAttempts: 0,
    lockedUntil: null,
    passwordChanged: false
  },
  {
    id: 2,
    username: 'juan.delacruz',
    passwordHash: bcrypt.hashSync('031590', 10), // MPIN: 031590
    role: ROLE_TYPES.RESIDENT, // Using numeric role ID
    failedAttempts: 0,
    lockedUntil: null,
    passwordChanged: false
  },
  {
    id: 3,
    username: 'maria.santos',
    passwordHash: bcrypt.hashSync('120885', 10), // MPIN: 120885
    role: ROLE_TYPES.RESIDENT, // Using numeric role ID
    failedAttempts: 0,
    lockedUntil: null,
    passwordChanged: false
  }
];

// =============================================================================
// SIMPLE HELPER FUNCTIONS
// =============================================================================

// Find user by username
function findUserByUsername(username) {
  return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

// Check if account is locked
function isAccountLocked(user) {
  if (!user.lockedUntil) return false;
  
  const now = new Date();
  if (now < user.lockedUntil) {
    return true; // Still locked
  } else {
    // Lock expired, reset
    user.lockedUntil = null;
    user.failedAttempts = 0;
    return false;
  }
}

// Handle failed login attempt
function handleFailedAttempt(user) {
  user.failedAttempts += 1;
  
  // Lock account after 5 failed attempts
  if (user.failedAttempts >= 5) {
    user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    return {
      locked: true,
      message: 'Account locked for 30 minutes due to multiple failed attempts.'
    };
  }
  
  const remaining = 5 - user.failedAttempts;
  return {
    locked: false,
    message: `Invalid credentials. ${remaining} attempts remaining before account lock.`
  };
}

// Reset failed attempts on successful login
function resetFailedAttempts(user) {
  user.failedAttempts = 0;
  user.lockedUntil = null;
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_SECRET_EXPIRES_IN }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// =============================================================================
// SIMPLE API ENDPOINTS
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'SmartLias Simple Backend',
    version: '1.0.0 - Student Edition'
  });
});

// Check username endpoint
app.post('/api/auth/check-username', (req, res) => {
  const { username } = req.body;
  
  // Simple validation
  if (!username || username.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Username is required'
    });
  }
  
  // Find user
  const user = findUserByUsername(username.trim());
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Username not found'
    });
  }
  
  // Check if account is locked
  if (isAccountLocked(user)) {
    const minutesRemaining = Math.ceil((user.lockedUntil - new Date()) / (1000 * 60));
    return res.status(423).json({
      success: false,
      error: `Account is locked. Try again in ${minutesRemaining} minutes.`,
      lockoutInfo: {
        isLocked: true,
        remainingMinutes: minutesRemaining
      }
    });
  }
  
  // Username found and account is accessible
  res.json({
    success: true,
    message: 'Username found',
    data: {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      requiresPasswordChange: user.passwordChanged === false
    },
    securityInfo: {
      failedAttempts: user.failedAttempts,
      maxAttempts: 5,
      remainingAttempts: 5 - user.failedAttempts
    }
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Simple validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }
  
  // Find user
  const user = findUserByUsername(username.trim());
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
  
  // Check if account is locked
  if (isAccountLocked(user)) {
    const minutesRemaining = Math.ceil((user.lockedUntil - new Date()) / (1000 * 60));
    return res.status(423).json({
      success: false,
      error: `Account is locked. Try again in ${minutesRemaining} minutes.`
    });
  }
  
  // Check password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValidPassword) {
    // Handle failed attempt
    const failResult = handleFailedAttempt(user);
    
    return res.status(401).json({
      success: false,
      error: failResult.message,
      securityInfo: {
        failedAttempts: user.failedAttempts,
        maxAttempts: 5,
        remainingAttempts: Math.max(0, 5 - user.failedAttempts),
        isLocked: failResult.locked
      }
    });
  }
  
  // Successful login
  resetFailedAttempts(user);
  const token = generateToken(user);
  
  // Determine redirect URL
  let redirectTo = user.role === ROLE_TYPES.ADMIN ? '/admin' : '/resident';
  if (!user.passwordChanged) {
    // User needs to change password
    redirectTo = '/change-pin';
  }
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      redirectTo
    }
  });
});

// Verify token endpoint
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
  
  res.json({
    success: true,
    data: {
      user: decoded
    }
  });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`Simple SmartLias Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth/`);
  console.log(`\nStudent Guide:`);
  console.log(`   - All code is in this single file for easy understanding`);
  console.log(`   - Uses in-memory database (replace with real DB later)`);
  console.log(`   - Simple JWT authentication with account lockout`);
  console.log(`   - Clear comments explain each section`);
});

module.exports = app;
