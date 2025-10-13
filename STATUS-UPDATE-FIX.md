# Status Update Error Fix - String to Integer Conversion

## Date: October 13, 2025

## Error Summary
```
error: invalid input syntax for type integer: "pending"
```

**Root Cause**: The `logAction` function was being called with string status values ("pending", "processing", etc.) but the database `document_requests_logs` table expects integer values for `old_status` and `new_status` columns.

---

## Problem Location

**File**: `backend/router.js`  
**Endpoint**: `PUT /api/document-requests/:id/status`  
**Line**: 2023 (before fix)

### Code Before Fix
```javascript
// Get current status before updating (for logging)
const currentRequest = await DocumentRequestRepository.getRequestById(id)
if (!currentRequest) {
  return ApiResponse.notFound(res, 'Document request not found')
}

const oldStatus = currentRequest.status_text  // ❌ This is a string!

// ... update code ...

// Log the action with STRING status values
await DocumentRequestRepository.logAction(
  id,
  actionMap[status],
  oldStatus,    // ❌ String: "pending"
  status,       // ❌ String: "processing"
  userId
)
```

---

## Solution

Convert string status values to their integer equivalents before calling `logAction`.

### Code After Fix
```javascript
// Get current status before updating (for logging)
const currentRequest = await DocumentRequestRepository.getRequestById(id)
if (!currentRequest) {
  return ApiResponse.notFound(res, 'Document request not found')
}

// Map old status text to numeric value
const oldStatusText = currentRequest.status_text
const reverseStatusMap = {
  'pending': 0,
  'processing': 1,
  'rejected': 2,
  'ready': 3,
  'claimed': 4
}
const oldStatusValue = reverseStatusMap[oldStatusText] || 0

// ... update code ...

// Log the action with INTEGER status values
await DocumentRequestRepository.logAction(
  id,
  actionMap[status],
  oldStatusValue,  // ✅ Integer: 0
  statusValue,     // ✅ Integer: 1
  userId
)
```

---

## Status Mapping Reference

| Status Text | Integer Value | Description |
|------------|---------------|-------------|
| `pending` | 0 | Initial status when request is created |
| `processing` | 1 | Admin is processing the request |
| `rejected` | 2 | Request was rejected |
| `ready` | 3 | Document is ready for pickup |
| `claimed` | 4 | Document has been claimed/completed |

---

## Database Schema

```sql
-- document_requests_logs table
CREATE TABLE document_requests_logs (
  id SERIAL PRIMARY KEY,
  document_request_id INTEGER REFERENCES document_requests(id),
  action TEXT NOT NULL,
  old_status INTEGER,        -- ✅ Must be integer (0-4)
  new_status INTEGER,        -- ✅ Must be integer (0-4)
  performed_by INTEGER REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Verification Steps

### 1. Test Status Update Workflow
```bash
# 1. Create a document request as resident
# 2. Login as admin
# 3. View pending request
# 4. Click "Process" button (pending → processing)
# 5. Should succeed without errors
```

### 2. Check Logs Table
```sql
-- Verify logs are being created with integer status values
SELECT 
  id, 
  document_request_id,
  action,
  old_status,  -- Should be 0, 1, 2, 3, or 4
  new_status,  -- Should be 0, 1, 2, 3, or 4
  performed_at
FROM document_requests_logs
ORDER BY performed_at DESC
LIMIT 10;
```

### 3. Expected Log Entry
```sql
-- After changing status from pending (0) to processing (1)
id | document_request_id | action                    | old_status | new_status | performed_by
---+---------------------+---------------------------+------------+------------+-------------
1  | 5                   | Marked as processing      | 0          | 1          | 1
```

---

## All `logAction` Calls Verified

### ✅ POST /api/document-requests (Line 1910)
```javascript
await DocumentRequestRepository.logAction(
  newRequest.id, 
  'Request created by resident', 
  null, 
  0,  // ✅ Already using integer
  parseInt(userId)
)
```

### ✅ PUT /api/document-requests/:id/status (Line 2032 - FIXED)
```javascript
await DocumentRequestRepository.logAction(
  id,
  actionMap[status],
  oldStatusValue,  // ✅ Now using integer
  statusValue,     // ✅ Now using integer
  userId
)
```

---

## Related Files Modified

1. ✅ `backend/router.js` - Fixed status update endpoint to use integer values
2. ✅ `.local/db/migrate-logs-status-to-integer.sql` - Migration script already exists
3. ✅ `.local/db/003-documents-schema.sql` - Schema already defines integer types

---

## Testing Results

**Before Fix**:
```
❌ Error: invalid input syntax for type integer: "pending"
❌ Status update fails
❌ Frontend shows error toast
```

**After Fix**:
```
✅ Status updates successfully
✅ Logs are created with integer values
✅ Frontend shows success toast
✅ Document list refreshes with new status
```

---

## Prevention

To prevent this issue in the future:

1. **Always use the status maps** when working with status values:
   ```javascript
   // For converting TO integers
   const statusMap = {
     'pending': 0,
     'processing': 1,
     'rejected': 2,
     'ready': 3,
     'claimed': 4
   }
   
   // For converting FROM integers
   const reverseStatusMap = {
     0: 'pending',
     1: 'processing',
     2: 'rejected',
     3: 'ready',
     4: 'claimed'
   }
   ```

2. **Type checking** in development:
   ```javascript
   // Before calling logAction, verify types
   console.assert(typeof oldStatusValue === 'number', 'oldStatus must be number')
   console.assert(typeof newStatusValue === 'number', 'newStatus must be number')
   ```

3. **Database constraints** already in place:
   ```sql
   -- The database will reject non-integer values
   old_status INTEGER
   new_status INTEGER
   ```

---

## Conclusion

The issue was a simple type mismatch: string status values being passed to a function expecting integers. The fix adds a reverse status mapping to convert the string status text to its corresponding integer value before logging.

This completes the status integer conversion work that was started earlier with the database schema updates.
