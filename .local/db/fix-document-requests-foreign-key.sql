-- ============================================
-- FIX DOCUMENT REQUESTS FOREIGN KEY CONSTRAINT
-- ============================================
-- Purpose: Fix the foreign key constraint to reference users table instead of residents table
-- Issue: document_requests.user_id should reference users.id, not residents.id

\c smartliasdb;

-- Drop the incorrect foreign key constraint
ALTER TABLE document_requests DROP CONSTRAINT IF EXISTS document_requests_resident_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE document_requests ADD CONSTRAINT document_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verify the constraint was added correctly
\d+ document_requests;

-- Show all foreign key constraints for verification
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' AND conrelid = 'document_requests'::regclass;
