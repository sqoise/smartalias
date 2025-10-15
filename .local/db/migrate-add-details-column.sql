-- Migration: Add details column to document_requests table
-- Run this to add the details field to existing databases

\c smartliasdb;

-- Add details column as TEXT (compatible with all PostgreSQL versions)
ALTER TABLE document_requests 
ADD COLUMN details TEXT DEFAULT NULL;

-- Add regular index for TEXT field performance
CREATE INDEX idx_document_requests_details ON public.document_requests USING btree (details);

-- Add column comment
COMMENT ON COLUMN "public"."document_requests"."details" IS 'Document-specific additional fields as simple JSON string (e.g., {"business_name":"My Store","business_address":"123 Main St"})';

-- No need to update existing rows - NULL is fine as default

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'document_requests' 
  AND column_name = 'details';

SELECT 'Migration completed successfully - details column added as TEXT!' AS status;
