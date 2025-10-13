# Migration: Convert Status Columns to INTEGER

## Problem
The `document_requests_logs` table may have `old_status` and `new_status` columns as `varchar` type instead of `integer`, causing issues with status logging.

## Solution
Convert these columns to `integer` type using the provided migration script.

## Status Mapping
| Status String | Integer Value |
|--------------|---------------|
| pending      | 0 |
| processing   | 1 |
| rejected     | 2 |
| ready        | 3 |
| completed/claimed | 4 |

## How to Run the Migration

### Option 1: Run the migration script (Recommended)
```bash
psql -d smartliasdb -f .local/db/migrate-logs-status-to-integer.sql
```

### Option 2: Run commands manually
```bash
# 1. Check current column types
psql -d smartliasdb -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'document_requests_logs' AND column_name IN ('old_status', 'new_status');"

# 2. Convert old_status to integer
psql -d smartliasdb -c "ALTER TABLE document_requests_logs ALTER COLUMN old_status TYPE integer USING CASE WHEN old_status = 'pending' THEN 0 WHEN old_status = 'processing' THEN 1 WHEN old_status = 'rejected' THEN 2 WHEN old_status = 'ready' THEN 3 WHEN old_status = 'claimed' OR old_status = 'completed' THEN 4 WHEN old_status ~ '^\d+$' THEN old_status::integer ELSE NULL END;"

# 3. Convert new_status to integer
psql -d smartliasdb -c "ALTER TABLE document_requests_logs ALTER COLUMN new_status TYPE integer USING CASE WHEN new_status = 'pending' THEN 0 WHEN new_status = 'processing' THEN 1 WHEN new_status = 'rejected' THEN 2 WHEN new_status = 'ready' THEN 3 WHEN new_status = 'claimed' OR new_status = 'completed' THEN 4 WHEN new_status ~ '^\d+$' THEN new_status::integer ELSE NULL END;"

# 4. Verify the changes
psql -d smartliasdb -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'document_requests_logs' AND column_name IN ('old_status', 'new_status');"
```

## What Was Fixed

### Backend Code Changes
**File**: `backend/repositories/DocumentRequestRepository.js`

**Before** (line 633):
```javascript
await this.logAction(id, actionMap[status], currentStatus, status, performedBy)
//                                                            ^^^^^^ - String value
```

**After**:
```javascript
await this.logAction(id, actionMap[status], currentStatus, statusValue, performedBy)
//                                                            ^^^^^^^^^^^ - Integer value
```

**Also Added**: 'completed' to the actionMap for proper logging.

### Database Schema
The schema file `003-documents-schema.sql` already defines the columns correctly as `integer`:
```sql
CREATE TABLE "public"."document_requests_logs" (
    "id" SERIAL PRIMARY KEY,
    "request_id" integer NOT NULL,
    "action" character varying(50) NOT NULL,
    "old_status" integer,      -- Already correct type
    "new_status" integer,      -- Already correct type
    "action_by" integer NOT NULL,
    "action_notes" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
```

## Verification

After running the migration, verify the changes:

```bash
# Check column types
psql -d smartliasdb -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'document_requests_logs' AND column_name IN ('old_status', 'new_status');"

# Expected output:
# column_name  | data_type
# -------------+-----------
# old_status   | integer
# new_status   | integer

# Check sample data
psql -d smartliasdb -c "SELECT id, request_id, action, old_status, new_status FROM document_requests_logs ORDER BY created_at DESC LIMIT 5;"

# All status values should now be integers (0, 1, 2, 3, or 4)
```

## Benefits
- ✅ Consistent data types across the application
- ✅ Proper status logging with integer values
- ✅ Better query performance with integer comparisons
- ✅ Prevents data type errors in status transitions
- ✅ Matches the backend code expectations

## Status Change Log Format

After the fix, the `document_requests_logs` will properly record:
- `old_status`: Previous status as integer (0-4)
- `new_status`: New status as integer (0-4)
- `action`: Description of what happened (e.g., "Marked as processing")
- `action_by`: User ID who performed the action
- `created_at`: Timestamp of the change

Example:
```
id | request_id | action                | old_status | new_status | action_by
---+------------+----------------------+-----------+------------+-----------
 1 |         15 | Marked as processing |         0 |          1 |         1
 2 |         15 | Marked as ready      |         1 |          3 |         1
 3 |         15 | Marked as completed  |         3 |          4 |         1
```
