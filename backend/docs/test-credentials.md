# Test Credentials for SMARTLIAS

## Fixed Login Issues

The login system has been fixed and synchronized between frontend and backend.

## Available Test Accounts

### Admin Account
- **Username**: `admin.staff`
- **PIN**: `123456`
- **Role**: admin
- **Access**: Full admin dashboard

### Resident Accounts  
- **Username**: `juan.delacruz`
- **PIN**: `654321`
- **Role**: resident

- **Username**: `maria.santos`
- **PIN**: `654321`
- **Role**: resident

## Backend Configuration

- **Port**: 9000
- **API Base URL**: `http://localhost:9000/api`
- **Data Source**: JSON files in `backend/data/`
- **Auth Endpoint**: `/api/auth/login`

## Frontend Configuration

- **Port**: 3000
- **API Client**: Configured to connect to `http://localhost:9000/api`
- **Environment**: Development mode

## Fixed Issues

1. **Data Structure**: Fixed users.json to use array format instead of nested object
2. **Field Mapping**: Updated field names to match backend expectations:
   - `password_hash` → `passwordHash`
   - `first_name` → `firstName` 
   - `last_name` → `lastName`
   - `role_type` → `role` (string instead of number)
   - `failed_attempts` → `failedLoginAttempts`
   - `locked_until` → `lockedUntil`
3. **PIN Hashing**: Generated proper bcrypt hashes for test PINs
4. **Account Status**: Reset all accounts to unlocked state

## Testing Login

1. Start backend: `cd backend && npm start` (port 9000)
2. Start frontend: `cd frontend && npm run dev` (port 3000)
3. Open `http://localhost:3000`
4. Use credentials above to test login

The login should now work correctly and redirect to appropriate dashboards based on user role.
