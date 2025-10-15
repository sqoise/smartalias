# SMARTLIAS Security Features Documentation

## 📋 Implemented Security Features

### 🔐 Authentication & Authorization
- **JWT Tokens**: Stateless authentication with 24-hour expiration
- **Bcrypt Password Hashing**: 12 rounds (2^12 = 4096 iterations) for strong password protection
- **Role-Based Access Control (RBAC)**: Admin, Staff, Resident roles with middleware enforcement
- **Account Lockout**: 10 failed login attempts = 15-minute lockout
- **Auto-Unlock**: Accounts automatically unlock after lockout period expires

### 🛡️ Input Validation & Sanitization
- **XSS Prevention**: All inputs sanitized to remove `<>'"&` characters
- **SQL Injection Prevention**: Parameterized queries using `$1, $2` placeholders
- **Input Length Limits**: Maximum 100 characters for most fields to prevent buffer overflow
- **Business Rule Validation**: Address minimum 20 characters, email format validation
- **Trim & Clean**: All inputs trimmed of whitespace and normalized

### 🚦 Rate Limiting
- **Authentication Endpoints**: 5 login attempts per 15 minutes per IP address
- **General API**: Configurable rate limiting per endpoint
- **Lockout Protection**: Prevents brute force attacks on user accounts

### 🔒 Password Security
- **Strong Hashing**: Bcrypt with 12 salt rounds
- **PIN Requirements**: 6-digit numeric PIN format (000000-999999)
- **Password Change Tracking**: Forces password change for admin-created accounts
- **No Password Storage**: Only hashed passwords stored, never plain text

### 🌐 Network Security
- **CORS Configuration**: Whitelist of allowed origins (localhost for dev, production domains)
- **HTTPS Ready**: Configured for secure transport in production
- **Environment Variables**: Sensitive data (JWT secrets, DB credentials) in environment files

### 📊 Audit & Logging
- **Winston Logging**: Comprehensive application logging with levels (info, warn, error)
- **Morgan HTTP Logs**: All HTTP requests logged with timestamps and response codes
- **Authentication Events**: Login attempts, failures, and lockouts logged
- **Security Events**: Failed authentication attempts logged with IP addresses
- **File Separation**: Application logs, error logs, and access logs in separate files

### 🔍 Data Protection
- **Database Security**: Parameterized queries prevent SQL injection
- **JSON File Security**: Input validation prevents malicious data injection
- **User Enumeration Protection**: Same error message for wrong username or wrong PIN
- **Session Management**: JWT tokens with proper expiration and validation

### ⚡ Real-time Security
- **Token Validation**: Every protected route validates JWT token
- **Middleware Chain**: Authentication → Authorization → Rate Limiting → Input Validation
- **Error Handling**: Security errors logged but generic messages returned to client
- **IP Tracking**: Failed login attempts tracked by IP address

## 🔧 Security Configuration

### Environment Variables
```env
# JWT Security
JWT_SECRET=cryptographically-secure-random-string
JWT_EXPIRES_IN=24h

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# Account Security
MAX_LOGIN_ATTEMPTS=10
LOCKOUT_TIME=900000  # 15 minutes

# Database Security
DATABASE_URL=postgresql://user:password@host:port/db  # Parameterized queries only
```

### Middleware Stack
```javascript
1. Morgan (HTTP Logging)
2. Rate Limiting (Per-IP limits)
3. CORS (Origin validation)
4. Body Parser (Size limits)
5. Authentication (JWT validation)
6. Authorization (Role checking)
7. Input Sanitization (XSS prevention)
8. Validation (Business rules)
```

## 🚨 Security Best Practices Implemented

### 1. **Never Trust User Input**
- Every input sanitized and validated
- Length limits on all fields
- XSS character removal
- SQL injection prevention via parameterized queries

### 2. **Least Privilege Principle**
- Role-based access with minimal required permissions
- Admin-only endpoints protected with `requireAdmin` middleware
- User can only access their own data

### 3. **Defense in Depth**
- Multiple security layers: Rate limiting + Authentication + Authorization + Validation
- Client-side AND server-side validation
- Database-level constraints

### 4. **Secure by Default**
- New accounts locked until password change (admin-created)
- Failed login attempts automatically tracked
- Tokens expire automatically (24 hours)
- CORS restricts origins by default

### 5. **Audit Everything**
- All authentication events logged
- Failed attempts logged with IP addresses
- Database changes will be audited (planned)
- Security incidents traceable

## 📈 Future Security Enhancements

### Planned Features
- [ ] **Two-Factor Authentication (2FA)**: SMS or app-based 2FA
- [ ] **Password Complexity Rules**: Stronger PIN requirements
- [ ] **Session Management**: Refresh tokens for extended sessions
- [ ] **Database Audit Triggers**: Automatic logging of all data changes
- [ ] **Intrusion Detection**: Automated threat detection and alerting
- [ ] **API Rate Limiting**: More granular per-user rate limits
- [ ] **File Upload Security**: If file uploads are added later
- [ ] **HTTPS Enforcement**: Redirect HTTP to HTTPS in production

### Compliance Considerations
- **Data Privacy**: Personal information protected and access logged
- **Government Requirements**: Audit trail for barangay record keeping
- **GDPR-Ready**: User data access and deletion capabilities planned

## 🔍 Security Testing Checklist

### Regular Security Checks
- [ ] Test SQL injection attempts on all endpoints
- [ ] Verify XSS prevention on form inputs
- [ ] Test authentication bypass attempts
- [ ] Verify rate limiting effectiveness
- [ ] Check CORS configuration
- [ ] Test account lockout mechanisms
- [ ] Verify JWT token expiration
- [ ] Test role-based access controls

---

**Last Updated**: October 4, 2025  
**Security Level**: Production Ready  
**Next Review**: Monthly security audit recommended
