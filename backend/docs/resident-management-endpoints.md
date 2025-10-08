# Resident Management API Endpoints

## Overview
Backend endpoints for managing residents in the SMARTLIAS system. All endpoints require authentication and most require admin privileges.

---

## 1. Update Resident (Edit)

**Endpoint**: `PUT /api/residents/:id`

**Authentication**: Required (JWT token)  
**Authorization**: Staff or Admin

**Description**: Update resident information including personal details, contact info, and administrative notes. Both staff and admin users can edit resident records.

### Request Format

**URL Parameters**:
- `id` (integer) - Resident ID

**Request Body** (supports both snake_case and camelCase):
```json
{
  "first_name": "Juan",
  "last_name": "Cruz",
  "middle_name": "Dela",
  "birth_date": "1990-01-15",
  "gender": "Male",
  "civil_status": "Single",
  "home_number": "123-4567",
  "mobile_number": "09171234567",
  "email": "juan.cruz@example.com",
  "address": "123 Main St, Brgy Sample",
  "notes": "Updated administrative notes"
}
```

**Note**: The endpoint now supports both formats:
- Frontend format: `first_name`, `last_name`, `birth_date`, etc.
- Legacy format: `firstName`, `lastName`, `birthDate`, etc.

### Response Format

**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "000042",
    "first_name": "Juan",
    "last_name": "Cruz",
    "middle_name": "Dela",
    "birth_date": "1990-01-15",
    "age": 35,
    "gender": "Male",
    "civil_status": "Single",
    "home_number": "123-4567",
    "mobile_number": "09171234567",
    "email": "juan.cruz@example.com",
    "address": "123 Main St, Brgy Sample",
    "notes": "Updated administrative notes",
    "is_active": 1,
    "updated_at": "2025-10-09T10:30:00.000Z"
  },
  "message": "Resident updated successfully"
}
```

**Error Responses**:
- `400` - Invalid resident ID or validation errors
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not admin)
- `404` - Resident not found
- `500` - Server error

---

## 2. Update Resident Status (Activate/Deactivate)

**Endpoint**: `PATCH /api/residents/:id/status`

**Authentication**: Required (JWT token)  
**Authorization**: Staff or Admin

**Description**: Toggle resident active status (activate or deactivate). Both staff and admin users can change resident status.

### Request Format

**URL Parameters**:
- `id` (integer) - Resident ID

**Request Body**:
```json
{
  "is_active": 0
}
```

**Values**:
- `0` = Inactive (deactivated)
- `1` = Active

### Response Format

**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "000042",
    "is_active": 0
  },
  "message": "Resident deactivated successfully"
}
```

**Error Responses**:
- `400` - Invalid resident ID or is_active value
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Resident not found
- `500` - Server error

---

## 3. Delete Resident (Hard Delete)

**Endpoint**: `DELETE /api/residents/:id`

**Authentication**: Required (JWT token)  
**Authorization**: Admin only

**Description**: Permanently delete a resident record. This action cannot be undone.

### Request Format

**URL Parameters**:
- `id` (integer) - Resident ID

**Request Body**: None

### Response Format

**Success (200)**:
```json
{
  "success": true,
  "message": "Resident deleted successfully"
}
```

**Error Responses**:
- `400` - Invalid resident ID
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Resident not found
- `500` - Server error

---

## Implementation Details

### Validation

All update operations use the same validation rules as resident creation:
- **First Name**: Required, 2-50 characters, letters and spaces only
- **Last Name**: Required, 2-50 characters, letters and spaces only
- **Mobile Number**: Required, valid Philippine mobile format (09xx-xxx-xxxx)
- **Email**: Optional, valid email format if provided
- **Birth Date**: Optional, valid date format if provided
- **Gender**: Optional, "Male" or "Female"
- **Civil Status**: Optional, predefined values (Single, Married, etc.)

### Sanitization

All text inputs are:
- Trimmed of whitespace
- Sanitized to remove XSS characters (`<`, `>`, `'`, `"`, `&`)
- Limited to 100 characters max
- Names and addresses are formatted to Title Case

### Database Operations

**PostgreSQL Database**:
- UPDATE operations use prepared statements to prevent SQL injection
- DELETE performs hard delete with `DELETE FROM residents WHERE id = $1`
- Status updates use optimized query updating only `is_active` field

**JSON Files (Development)**:
- Updates modify the matching record in the array
- Hard delete removes the record from the array completely
- Status updates modify only the `is_active` field

### Logging

All operations are logged with:
- Action performed (update/delete/status change)
- Admin username who performed the action
- Resident ID affected
- Updated fields (for updates)
- Timestamp

**Example Log Entry**:
```
[INFO] Resident updated by admin.kapitan { residentId: 42, updatedFields: ['first_name', 'email', 'notes'] }
[INFO] Resident status updated by admin.kapitan { residentId: 42, newStatus: 'inactive' }
[INFO] Resident deleted by admin.kapitan { residentId: 42 }
```

---

## Security Features

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Role-Based Access Control**: Only admins can perform these operations
3. **Rate Limiting**: All endpoints protected by `generalLimiter` (15 requests per 15 minutes)
4. **Input Sanitization**: All inputs sanitized to prevent XSS attacks
5. **SQL Injection Prevention**: Parameterized queries used for all database operations
6. **Audit Trail**: All actions logged with admin username and timestamp

---

## Frontend Integration

### API Client Usage

```javascript
// Update resident
const response = await ApiClient.request(`/residents/${residentId}`, {
  method: 'PUT',
  body: {
    first_name: 'Juan',
    last_name: 'Cruz',
    email: 'juan@example.com',
    notes: 'Updated notes'
  }
})

// Toggle activation status
const response = await ApiClient.request(`/residents/${residentId}/status`, {
  method: 'PATCH',
  body: {
    is_active: 0 // or 1
  }
})

// Delete resident
const response = await ApiClient.request(`/residents/${residentId}`, {
  method: 'DELETE'
})
```

---

## Testing

### Manual Testing with curl

**Update Resident**:
```bash
curl -X PUT http://localhost:9000/api/residents/42 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "first_name": "Juan",
    "last_name": "Cruz",
    "email": "juan@example.com"
  }'
```

**Update Status**:
```bash
curl -X PATCH http://localhost:9000/api/residents/42/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"is_active": 0}'
```

**Delete Resident**:
```bash
curl -X DELETE http://localhost:9000/api/residents/42 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Handling

All endpoints follow the standardized API response format:

**Error Response Structure**:
```json
{
  "success": false,
  "error": "Error message here",
  "errors": {
    "fieldName": ["Error detail 1", "Error detail 2"]
  }
}
```

**Common Error Scenarios**:
1. **Missing required fields**: Returns 400 with validation errors
2. **Invalid ID format**: Returns 400 with "Valid resident ID is required"
3. **Resident not found**: Returns 404
4. **Unauthorized**: Returns 401 if token is missing/invalid
5. **Forbidden**: Returns 403 if user is not admin
6. **Server error**: Returns 500 with generic error message

---

## Change History

- **2025-10-09**: Updated authorization - Staff can now perform PUT (edit) and PATCH (status) operations
- **2025-10-09**: DELETE operation remains admin-only for security
- **2025-10-09**: Updated PUT endpoint to support both snake_case and camelCase field names
- **2025-10-09**: Changed DELETE endpoint from soft delete to hard delete (permanent removal)
- **2025-10-09**: Added comprehensive documentation for all resident management endpoints

---

## Role-Based Access Summary

**Admin Role** (role = 1):
- ✅ Can edit residents (PUT)
- ✅ Can activate/deactivate residents (PATCH)
- ✅ Can delete residents (DELETE)

**Staff Role** (role = 2):
- ✅ Can edit residents (PUT)
- ✅ Can activate/deactivate residents (PATCH)
- ❌ Cannot delete residents (DELETE) - Admin only

**Resident Role** (role = 3):
- ❌ Cannot perform any of these operations
- Can only view their own information
