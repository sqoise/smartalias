/**
 * SMARTLIAS API Response Standards
 * Standardized response patterns for consistent API responses
 */

## ApiResponse Usage Examples

All API endpoints MUST use the ApiResponse utility to ensure consistent response format.

### Import
```javascript
const ApiResponse = require('./utils/apiResponse')
```

### Success Responses

#### Simple Success
```javascript
return ApiResponse.success(res, null, 'Operation completed successfully')
```

#### Success with Data
```javascript
return ApiResponse.success(res, userData, 'User retrieved successfully')
```

#### Success with Custom Status
```javascript
return ApiResponse.success(res, newUser, 'User created successfully', 201)
```

### Error Responses

#### Validation Error
```javascript
return ApiResponse.validationError(res, {
  username: 'Username is required',
  pin: 'PIN must be 6 digits'
}, 'Validation failed')
```

#### Unauthorized
```javascript
return ApiResponse.unauthorized(res, 'Invalid credentials')
```

#### Forbidden
```javascript
return ApiResponse.forbidden(res, 'Admin access required')
```

#### Not Found
```javascript
return ApiResponse.notFound(res, 'User not found')
```

#### Server Error
```javascript
return ApiResponse.serverError(res, 'Database connection failed', error)
```

#### Custom Error
```javascript
return ApiResponse.error(res, 'Custom error message', 422, { details: 'Additional info' })
```

### Special Responses

#### Health Check
```javascript
return ApiResponse.health(res, isHealthy, { environment: 'production' })
```

#### Paginated Data
```javascript
return ApiResponse.paginated(res, users, {
  page: 1,
  limit: 10,
  total: 100
}, 'Users retrieved successfully')
```

## Standard Response Format

All responses follow this structure:

### Success Response
```json
{
  "success": true,
  "code": 200,
  "message": "Request successful",
  "timestamp": "2025-09-11 14:30:45",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "code": 400,
  "message": "Request failed",
  "timestamp": "2025-09-11 14:30:45",
  "error": { ... }
}
```

### Validation Error Response
```json
{
  "success": false,
  "code": 422,
  "message": "Validation failed",
  "timestamp": "2025-09-11 14:30:45",
  "error": {
    "validation": {
      "username": "Username is required",
      "pin": "PIN must be 6 digits"
    }
  }
}
```

### Health Response
```json
{
  "success": true,
  "code": 200,
  "message": "SMARTLIAS API is running",
  "timestamp": "2025-09-11 14:30:45",
  "version": "1.0.0",
  "environment": "development"
}
```

### Paginated Response
```json
{
  "success": true,
  "code": 200,
  "message": "Users retrieved successfully",
  "timestamp": "2025-09-11 14:30:45",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Migration Guide

Replace existing response patterns:

### Before (Old Pattern)
```javascript
res.status(400).json({
  success: false,
  error: 'Validation failed'
})
```

### After (New Pattern)
```javascript
return ApiResponse.error(res, 'Validation failed', 400)
```

### Before (Old Success)
```javascript
res.json({
  success: true,
  data: users,
  message: 'Users retrieved'
})
```

### After (New Success)
```javascript
return ApiResponse.success(res, users, 'Users retrieved')
```

## Benefits

1. **Consistency**: All endpoints return the same response structure
2. **DRY Principle**: No code duplication for response formatting
3. **Timestamps**: Automatic Manila timezone timestamps
4. **Type Safety**: Standardized error and success patterns
5. **Maintainability**: Easy to modify response format across entire API
