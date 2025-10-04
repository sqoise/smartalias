# Test Credentials for SMARTLIAS

## Database Configuration

**IMPORTANT**: SMARTLIAS is now using PostgreSQL database instead of JSON files.

- **Data Source**: PostgreSQL Database (smartliasdb)
- **Configuration**: USE_MOCK_DATA=false in .env
- **Backend Port**: 9000
- **API Base URL**: `http://localhost:9000/api`
- **Auth Endpoint**: `/api/auth/login`

## Available Test Accounts (Database)

### Admin Account
- **Username**: `admin.kapitan`
- **PIN**: Check database or ask system admin
- **Role**: 1 (Admin)
- **Access**: Full admin dashboard
- **Status**: Password change required (is_password_changed = 0)

### Additional Users
- Check database for current users with: 
```sql
SELECT id, username, role, is_password_changed FROM users;
```

## Role System (Numeric)
- **Role 1**: Admin (Full access)
- **Role 2**: Staff (Limited access) 
- **Role 3**: Resident (Personal access)

## Migration Status
- ✅ **Database**: PostgreSQL running and connected
- ✅ **User Authentication**: Using database instead of JSON files
- ✅ **Role-based Access**: Numeric roles (1=Admin, 2=Staff, 3=Resident)
- ⚠️ **JSON Files**: Will be removed soon (no longer used)

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
