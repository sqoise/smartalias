# Fix: Document Request Creation Error

## Problem
When residents try to create a new document request, the API returns:
```
API Error: "Failed to submit document request"
```

Backend error log shows:
```
error: invalid input syntax for type integer: "pending"
at DocumentRequestRepository.logAction
```

## Root Cause
The `logAction()` function in `backend/router.js` (line 1918) was being called with the string value `'pending'` instead of the integer value `0` for the `new_status` parameter.

Since the `document_requests_logs` table expects `new_status` to be an `integer` type (not `varchar`), PostgreSQL rejected the insert statement.

## Fix Applied

### File: `backend/router.js`

**Before** (line 1918):
```javascript
await DocumentRequestRepository.logAction(
  newRequest.id, 
  'Request created by resident', 
  null, 
  'pending',  // ❌ String value
  parseInt(userId)
)
```

**After**:
```javascript
await DocumentRequestRepository.logAction(
  newRequest.id, 
  'Request created by resident', 
  null, 
  0,  // ✅ Integer value (0 = pending)
  parseInt(userId)
)
```

## Status Integer Mapping (Reference)
| Status | Integer Value |
|--------|---------------|
| pending | 0 |
| processing | 1 |
| rejected | 2 |
| ready | 3 |
| completed | 4 |

## Testing
After this fix, residents should be able to:
1. Navigate to the Document Requests page
2. Select a document type
3. Fill in the purpose and notes
4. Submit the request successfully
5. See the request appear with "Pending" status

## Related Fixes
This is part of the larger effort to ensure all status-related code uses integer values:
- ✅ `logAction()` in bulk update operations (already fixed)
- ✅ `logAction()` in document request creation (this fix)
- ✅ Database schema with integer status columns

## Verification
Check the `document_requests_logs` table after creating a request:
```sql
SELECT 
    id,
    request_id,
    action,
    old_status,
    new_status,
    action_by,
    created_at
FROM document_requests_logs
ORDER BY created_at DESC
LIMIT 5;
```

Expected output:
```
id | request_id | action                          | old_status | new_status | action_by
---+------------+---------------------------------+------------+------------+-----------
 1 |         25 | Request created by resident     | (null)     |          0 |         7
```

Note: `old_status` is NULL for new requests (no previous status), and `new_status` is `0` (pending).
