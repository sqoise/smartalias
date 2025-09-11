# 🚀 PRODUCTION RELEASE GUIDE

## Overview
This guide provides step-by-step instructions for removing demo code and preparing SMARTLIAS for production deployment.

## 📋 Production Release Checklist

To prepare for production release, search for and remove:

1. All lines containing `DEMO:` comments
2. All lines containing `TODO: Remove this line for production release`
3. Change isDemoMode from `|| true` to just environment check
4. Remove demo credentials section in LoginCard.jsx

### Quick Search Commands
```bash
# Find all demo code
grep -r "DEMO:" frontend/
grep -r "TODO: Remove" frontend/
grep -r "isDemoMode.*true" frontend/
```

## 🔧 Demo Configuration (Current Setup)

### Demo Users for Testing
```javascript
const DEMO_USERS = [
  { username: 'admin.staff', mpin: '010180', role: 'admin' },
  { username: 'juan.delacruz', mpin: '031590', role: 'resident' },
  { username: 'maria.santos', mpin: '120885', role: 'resident' }
]
```

### Current Demo Features
- ✅ Testing all validation messages
- ✅ Testing error states  
- ✅ Testing success flows
- ✅ Easy production turnover

## 🎯 Production Deployment Steps

### Step 1: Find All Demo Code
```bash
grep -r "DEMO:" frontend/
grep -r "TODO: Remove" frontend/
```

### Step 2: Switch to Live Data Source
**Set environment variable for LIVE backend:**
```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```

**Or in production deployment, set the environment variable:**
- Development: `NEXT_PUBLIC_USE_MOCK_DATA=true` (uses JSON files)
- Production: `NEXT_PUBLIC_USE_MOCK_DATA=false` (uses backend API)

### Step 3: Remove Demo UI Elements
- Remove demo credentials section in `LoginCard.jsx`
- Remove any demo banners or indicators
- Look for sections marked with `DEMO:` comments

### Step 4: Test Production Mode
```bash
# Set production environment
NODE_ENV=production npm run build
NODE_ENV=production npm start

# Test the following:
# - Strict validation is active
# - No demo credentials visible
# - Real authentication flow works
# - All validation messages appear correctly
```

### Step 5: Final Validation
- [ ] All demo code removed
- [ ] Production validation active
- [ ] No demo UI elements visible
- [ ] Authentication works with real backend
- [ ] Ready for real users

## 🧪 Testing Capabilities (Demo Mode)

While in demo mode, you can test:

1. **All validation messages** - Try invalid usernames, special characters, length limits
2. **Error states** - Empty fields, wrong formats
3. **Success flows** - Valid credentials, navigation
4. **UI responsiveness** - Mobile, desktop, keypad behavior
5. **Toast notifications** - All message types and expansion

## 📁 Files to Check for Demo Code

- `/app/login/page.js` - Main validation logic
- `/components/public/LoginCard.jsx` - Demo credentials section
- `/lib/auth.js` - Authentication logic
- Any other components with user validation

## ⚠️ Important Notes

- Demo mode is controlled by environment variables
- All demo code is clearly marked with `DEMO:` prefixes
- Production mode enforces strict validation
- Always test production mode before deployment
