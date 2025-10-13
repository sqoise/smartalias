-- ============================================
-- DOCUMENT REQUEST PROCESSING SQL QUERIES
-- ============================================
-- Purpose: Manual SQL queries for processing document requests
-- Usage: Execute these queries directly in your PostgreSQL database
-- Date: October 12, 2025

-- ============================================
-- QUICK REFERENCE: STATUS VALUES
-- ============================================
-- 0 = Pending (newly submitted)
-- 1 = Processing (being worked on)
-- 2 = Rejected (denied with reason)
-- 3 = Ready (ready for pickup)
-- 4 = Claimed (completed/picked up)

-- ============================================
-- 1. VIEW PENDING REQUESTS
-- ============================================

-- Get all pending requests with resident details
SELECT 
    dr.id,
    dr.resident_id,
    dr.document_id,
    dr.purpose,
    dr.status,
    dr.created_at,
    CONCAT(r.first_name, ' ', r.last_name) as resident_name,
    r.mobile_number,
    r.email,
    dc.title as document_title,
    dc.fee,
    EXTRACT(DAYS FROM NOW() - dr.created_at) as days_pending
FROM document_requests dr
JOIN residents r ON dr.resident_id = r.id
JOIN document_catalog dc ON dr.document_id = dc.id
WHERE dr.status = 0  -- pending status
ORDER BY dr.created_at ASC;

-- Get urgent pending requests (older than 3 days)
SELECT 
    dr.id,
    CONCAT(r.first_name, ' ', r.last_name) as resident_name,
    dc.title as document_title,
    dr.created_at,
    EXTRACT(DAYS FROM NOW() - dr.created_at) as days_pending
FROM document_requests dr
JOIN residents r ON dr.resident_id = r.id
JOIN document_catalog dc ON dr.document_id = dc.id
WHERE dr.status = 0 
  AND dr.created_at < NOW() - INTERVAL '3 days'
ORDER BY dr.created_at ASC;

-- ============================================
-- 2. PROCESS SINGLE REQUEST
-- ============================================

-- Mark request as PROCESSING
BEGIN;
UPDATE document_requests 
SET 
    status = 1,                    -- processing
    processed_by = 6,              -- replace with your user ID
    processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 22                      -- replace with actual request ID
  AND status = 0;                  -- only if currently pending

INSERT INTO document_requests_logs (
    request_id, action, old_status, new_status, action_by, created_at
) VALUES (
    22,                            -- request_id
    'status_changed',              -- action
    0,                            -- old_status (pending)
    1,                            -- new_status (processing)
    6,                            -- user_id who processed it
    CURRENT_TIMESTAMP
);
COMMIT;

-- Mark request as READY FOR PICKUP
BEGIN;
UPDATE document_requests 
SET 
    status = 3,                    -- ready
    processed_by = 6,              -- replace with your user ID
    processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 22                      -- replace with actual request ID
  AND status IN (0, 1);            -- pending or processing

INSERT INTO document_requests_logs (
    request_id, action, old_status, new_status, action_by, created_at
) VALUES (
    22,                            -- request_id
    'status_changed',              -- action
    (SELECT status FROM document_requests WHERE id = 22), -- get current status
    3,                            -- new_status (ready)
    6,                            -- user_id who processed it
    CURRENT_TIMESTAMP
);
COMMIT;

-- REJECT request with reason
BEGIN;
UPDATE document_requests 
SET 
    status = 2,                    -- rejected
    processed_by = 6,              -- replace with your user ID
    processed_at = CURRENT_TIMESTAMP,
    remarks = 'Missing required documents',  -- rejection reason
    updated_at = CURRENT_TIMESTAMP
WHERE id = 22                      -- replace with actual request ID
  AND status IN (0, 1);            -- pending or processing

INSERT INTO document_requests_logs (
    request_id, action, old_status, new_status, action_by, created_at
) VALUES (
    22,                            -- request_id
    'status_changed',              -- action
    0,                            -- old_status (pending)
    2,                            -- new_status (rejected)
    6,                            -- user_id who processed it
    CURRENT_TIMESTAMP
);
COMMIT;

-- Mark request as CLAIMED/COMPLETED
BEGIN;
UPDATE document_requests 
SET 
    status = 4,                    -- claimed
    processed_by = 6,              -- replace with your user ID
    processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 22                      -- replace with actual request ID
  AND status = 3;                  -- only if ready for pickup

INSERT INTO document_requests_logs (
    request_id, action, old_status, new_status, action_by, created_at
) VALUES (
    22,                            -- request_id
    'status_changed',              -- action
    3,                            -- old_status (ready)
    4,                            -- new_status (claimed)
    6,                            -- user_id who processed it
    CURRENT_TIMESTAMP
);
COMMIT;

-- ============================================
-- 3. BATCH PROCESSING
-- ============================================

-- Mark multiple requests as PROCESSING (replace IDs as needed)
BEGIN;
UPDATE document_requests 
SET 
    status = 1,                    -- processing
    processed_by = 6,              -- replace with your user ID
    processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (22, 23, 24)           -- replace with actual request IDs
  AND status = 0;                  -- only pending requests

-- Log each status change
INSERT INTO document_requests_logs (request_id, action, old_status, new_status, action_by, created_at)
SELECT id, 'status_changed', 0, 1, 6, CURRENT_TIMESTAMP
FROM document_requests 
WHERE id IN (22, 23, 24) AND status = 1;
COMMIT;

-- Batch approve multiple requests as READY
BEGIN;
UPDATE document_requests 
SET 
    status = 3,                    -- ready
    processed_by = 6,              -- replace with your user ID
    processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (22, 23, 24)           -- replace with actual request IDs
  AND status IN (0, 1);            -- pending or processing

-- Log each status change
INSERT INTO document_requests_logs (request_id, action, old_status, new_status, action_by, created_at)
SELECT id, 'status_changed', 0, 3, 6, CURRENT_TIMESTAMP
FROM document_requests 
WHERE id IN (22, 23, 24) AND status = 3;
COMMIT;

-- ============================================
-- 4. REPORTING & STATISTICS
-- ============================================

-- Get processing queue summary
SELECT 
    COUNT(CASE WHEN status = 0 THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 1 THEN 1 END) as processing_count,
    COUNT(CASE WHEN status = 3 THEN 1 END) as ready_count,
    COUNT(CASE WHEN status = 0 AND created_at < NOW() - INTERVAL '3 days' THEN 1 END) as urgent_count,
    COUNT(CASE WHEN status = 0 AND created_at::date = CURRENT_DATE THEN 1 END) as today_submissions,
    AVG(EXTRACT(DAYS FROM NOW() - created_at)) FILTER (WHERE status = 0) as avg_pending_days,
    MIN(created_at) FILTER (WHERE status = 0) as oldest_pending
FROM document_requests
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Get daily processing statistics for last 7 days
SELECT 
    DATE(processed_at) as process_date,
    COUNT(CASE WHEN status = 1 THEN 1 END) as marked_processing,
    COUNT(CASE WHEN status = 2 THEN 1 END) as rejected,
    COUNT(CASE WHEN status = 3 THEN 1 END) as marked_ready,
    COUNT(CASE WHEN status = 4 THEN 1 END) as marked_claimed
FROM document_requests
WHERE processed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(processed_at)
ORDER BY process_date DESC;

-- Get most requested documents
SELECT 
    dc.title as document_type,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN dr.status = 0 THEN 1 END) as pending,
    COUNT(CASE WHEN dr.status = 2 THEN 1 END) as rejected,
    COUNT(CASE WHEN dr.status = 4 THEN 1 END) as completed,
    ROUND(
        COUNT(CASE WHEN dr.status = 4 THEN 1 END) * 100.0 / COUNT(*), 2
    ) as completion_rate
FROM document_requests dr
JOIN document_catalog dc ON dr.document_id = dc.id
WHERE dr.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dc.title
ORDER BY total_requests DESC;

-- ============================================
-- 5. AUDIT & HISTORY
-- ============================================

-- Get processing history for a specific request
SELECT 
    drl.id,
    drl.action,
    drl.old_status,
    drl.new_status,
    drl.created_at,
    CONCAT(u.first_name, ' ', u.last_name) as processed_by_name
FROM document_requests_logs drl
LEFT JOIN users u ON drl.action_by = u.id
WHERE drl.request_id = 22          -- replace with actual request ID
ORDER BY drl.created_at DESC;

-- Get all processing activity by a specific user today
SELECT 
    drl.request_id,
    drl.action,
    drl.old_status,
    drl.new_status,
    drl.created_at,
    CONCAT(r.first_name, ' ', r.last_name) as resident_name,
    dc.title as document_title
FROM document_requests_logs drl
JOIN document_requests dr ON drl.request_id = dr.id
JOIN residents r ON dr.resident_id = r.id
JOIN document_catalog dc ON dr.document_id = dc.id
WHERE drl.action_by = 6            -- replace with user ID
  AND drl.created_at::date = CURRENT_DATE
ORDER BY drl.created_at DESC;

-- ============================================
-- 6. MAINTENANCE QUERIES
-- ============================================

-- Find requests stuck in processing for more than 7 days
SELECT 
    dr.id,
    CONCAT(r.first_name, ' ', r.last_name) as resident_name,
    dc.title as document_title,
    dr.processed_at,
    EXTRACT(DAYS FROM NOW() - dr.processed_at) as days_in_processing
FROM document_requests dr
JOIN residents r ON dr.resident_id = r.id
JOIN document_catalog dc ON dr.document_id = dc.id
WHERE dr.status = 1  -- processing
  AND dr.processed_at < NOW() - INTERVAL '7 days'
ORDER BY dr.processed_at ASC;

-- Find ready documents not claimed for more than 14 days
SELECT 
    dr.id,
    CONCAT(r.first_name, ' ', r.last_name) as resident_name,
    r.mobile_number,
    dc.title as document_title,
    dr.processed_at as ready_date,
    EXTRACT(DAYS FROM NOW() - dr.processed_at) as days_ready
FROM document_requests dr
JOIN residents r ON dr.resident_id = r.id
JOIN document_catalog dc ON dr.document_id = dc.id
WHERE dr.status = 3  -- ready
  AND dr.processed_at < NOW() - INTERVAL '14 days'
ORDER BY dr.processed_at ASC;

-- ============================================
-- USAGE NOTES:
-- ============================================
-- 1. Replace 'user_id' values (6) with your actual user ID
-- 2. Replace 'request_id' values (22) with actual request IDs
-- 3. Execute BEGIN; and COMMIT; together as a transaction
-- 4. Use the API endpoints for production use when possible
-- 5. These queries are for manual processing or testing
-- ============================================
