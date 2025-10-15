-- ============================================
-- MANUAL DATABASE UPDATE COMMAND
-- ============================================
-- FIXED: Foreign key constraint corrected to reference users table instead of residents table
-- Run this if you have the wrong foreign key: 
-- ALTER TABLE document_requests DROP CONSTRAINT IF EXISTS document_requests_resident_id_fkey;
-- ALTER TABLE document_requests ADD CONSTRAINT document_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--
-- If you have existing data with string status values, run these commands:
-- 
-- 1. Convert document_requests status from varchar to integer:
-- psql -d smartliasdb -c "ALTER TABLE document_requests ALTER COLUMN status TYPE integer USING CASE WHEN status = 'pending' THEN 0 WHEN status = 'processing' THEN 1 WHEN status = 'rejected' THEN 2 WHEN status = 'ready' THEN 3 WHEN status = 'claimed' OR status = 'completed' THEN 4 ELSE 0 END;"
-- psql -d smartliasdb -c "ALTER TABLE document_requests ALTER COLUMN status SET DEFAULT 0;"
--
-- 2. Convert document_requests_logs old_status and new_status from varchar to integer:
-- psql -d smartliasdb -c "ALTER TABLE document_requests_logs ALTER COLUMN old_status TYPE integer USING CASE WHEN old_status = 'pending' THEN 0 WHEN old_status = 'processing' THEN 1 WHEN old_status = 'rejected' THEN 2 WHEN old_status = 'ready' THEN 3 WHEN old_status = 'claimed' OR old_status = 'completed' THEN 4 ELSE NULL END;"
-- psql -d smartliasdb -c "ALTER TABLE document_requests_logs ALTER COLUMN new_status TYPE integer USING CASE WHEN new_status = 'pending' THEN 0 WHEN new_status = 'processing' THEN 1 WHEN new_status = 'rejected' THEN 2 WHEN new_status = 'ready' THEN 3 WHEN new_status = 'claimed' OR new_status = 'completed' THEN 4 ELSE NULL END;"
--
-- Status mapping: pending=0, processing=1, rejected=2, ready=3, completed/claimed=4
-- ============================================

-- ============================================
-- 003-DOCUMENTS SCHEMA
-- ============================================
-- Purpose: Document management system (catalog, requests, processing)
-- Dependencies: 001-core-tables.sql
-- Tables: document_catalog, document_requests, document_request_logs

-- Connect to database
\c smartliasdb;

-- ============================================
-- DOCUMENT TABLES
-- ============================================

-- Drop existing tables
DROP TABLE IF EXISTS "document_requests_logs" CASCADE;
DROP TABLE IF EXISTS "document_requests" CASCADE;
DROP TABLE IF EXISTS "document_catalog" CASCADE;

-- Document Catalog table (Available Document Types)
CREATE TABLE "public"."document_catalog" (
    "id" SERIAL PRIMARY KEY,
    "title" character varying(255) NOT NULL,
    "description" text,
    "filename" character varying(255),
    "fee" numeric(10,2) DEFAULT 0.00,
    "is_active" integer DEFAULT 1,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Document Requests table (Service Management)
CREATE TABLE "public"."document_requests" (
    "id" SERIAL PRIMARY KEY,
    "user_id" integer NOT NULL,
    "document_id" integer NOT NULL,
    "purpose" character varying(255),
    "remarks" text,
    "status" integer DEFAULT 0,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "processed_by" integer,
    "processed_at" timestamp DEFAULT NULL,
    "notes" text,
    "details" text DEFAULT NULL
);

-- Document Requests Logs table (History tracking)
CREATE TABLE "public"."document_requests_logs" (
    "id" SERIAL PRIMARY KEY,
    "request_id" integer NOT NULL,
    "action" character varying(50) NOT NULL,
    "old_status" integer,
    "new_status" integer,
    "action_by" integer NOT NULL,
    "action_notes" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Document Catalog indexes
CREATE INDEX idx_document_catalog_active ON public.document_catalog USING btree (is_active);
CREATE INDEX idx_document_catalog_title ON public.document_catalog USING btree (title);

-- Document Requests indexes
CREATE INDEX idx_document_requests_user_id ON public.document_requests USING btree (user_id);
CREATE INDEX idx_document_requests_document_id ON public.document_requests USING btree (document_id);
CREATE INDEX idx_document_requests_status ON public.document_requests USING btree (status);
CREATE INDEX idx_document_requests_created_at ON public.document_requests USING btree (created_at);
CREATE INDEX idx_document_requests_processed_by ON public.document_requests USING btree (processed_by);
CREATE INDEX idx_document_requests_details ON public.document_requests USING btree (details);

-- Document Requests Logs indexes
CREATE INDEX idx_document_requests_logs_request_id ON public.document_requests_logs USING btree (request_id);
CREATE INDEX idx_document_requests_logs_action ON public.document_requests_logs USING btree (action);
CREATE INDEX idx_document_requests_logs_created_at ON public.document_requests_logs USING btree (created_at);
CREATE INDEX idx_document_requests_logs_action_by ON public.document_requests_logs USING btree (action_by);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================
-- NOTE: Fixed foreign key constraint to reference users table (not residents table)
-- The document_requests.user_id should reference users.id since we use user_id throughout the app

-- Document Requests foreign keys
ALTER TABLE ONLY "public"."document_requests" ADD CONSTRAINT "document_requests_user_id_fkey" 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."document_requests" ADD CONSTRAINT "document_requests_document_id_fkey" 
    FOREIGN KEY (document_id) REFERENCES document_catalog(id) ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."document_requests" ADD CONSTRAINT "document_requests_processed_by_fkey" 
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

-- Document Requests Logs foreign keys
ALTER TABLE ONLY "public"."document_requests_logs" ADD CONSTRAINT "document_requests_logs_request_id_fkey" 
    FOREIGN KEY (request_id) REFERENCES document_requests(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."document_requests_logs" ADD CONSTRAINT "document_requests_logs_action_by_fkey" 
    FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE "public"."document_catalog" IS 'Master catalog of available document types with fees and requirements';
COMMENT ON TABLE "public"."document_requests" IS 'Resident document requests and applications for barangay certificates and clearances';
COMMENT ON TABLE "public"."document_requests_logs" IS 'Audit trail of all changes made to document requests for transparency and compliance';

-- ============================================
-- COLUMN COMMENTS
-- ============================================

-- Document Catalog Table Comments
COMMENT ON COLUMN "public"."document_catalog"."id" IS 'Primary key - unique identifier for document types';
COMMENT ON COLUMN "public"."document_catalog"."title" IS 'Official document name: Barangay Clearance, Certificate of Indigency, etc.';
COMMENT ON COLUMN "public"."document_catalog"."description" IS 'Detailed description including requirements and processing info';
COMMENT ON COLUMN "public"."document_catalog"."filename" IS 'Template file name for document generation - optional';
COMMENT ON COLUMN "public"."document_catalog"."fee" IS 'Processing fee in Philippine Peso (₱) - 0.00 for free documents';
COMMENT ON COLUMN "public"."document_catalog"."is_active" IS '1=available for request, 0=temporarily disabled/unavailable';
COMMENT ON COLUMN "public"."document_catalog"."created_at" IS 'Document type creation timestamp';
COMMENT ON COLUMN "public"."document_catalog"."updated_at" IS 'Last modification timestamp for document type';

-- Document Requests Table Comments
COMMENT ON COLUMN "public"."document_requests"."id" IS 'Primary key - unique identifier for document requests';
COMMENT ON COLUMN "public"."document_requests"."user_id" IS 'Links to users table - who requested the document';
COMMENT ON COLUMN "public"."document_requests"."document_id" IS 'Links to document_catalog table - what document type was requested';
COMMENT ON COLUMN "public"."document_requests"."purpose" IS 'Free text - why the resident needs this document';
COMMENT ON COLUMN "public"."document_requests"."remarks" IS 'Internal staff/admin notes - processing details, rejection reasons, special instructions';
COMMENT ON COLUMN "public"."document_requests"."status" IS 'Processing status (integer): 0=pending, 1=processing, 2=rejected, 3=ready, 4=completed';
COMMENT ON COLUMN "public"."document_requests"."created_at" IS 'Request submission timestamp - when resident submitted request';
COMMENT ON COLUMN "public"."document_requests"."updated_at" IS 'Last status change timestamp - updated on any modifications';
COMMENT ON COLUMN "public"."document_requests"."processed_by" IS 'Which admin/staff user processed/completed the request';
COMMENT ON COLUMN "public"."document_requests"."processed_at" IS 'When the request was completed/processed';
COMMENT ON COLUMN "public"."document_requests"."notes" IS 'Additional information or special requests from the resident';
COMMENT ON COLUMN "public"."document_requests"."details" IS 'Document-specific additional fields as simple JSON string (e.g., {"business_name":"My Store","business_address":"123 Main St"})';

-- Document Requests Logs Table Comments
COMMENT ON COLUMN "public"."document_requests_logs"."id" IS 'Primary key - unique identifier for log entries';
COMMENT ON COLUMN "public"."document_requests_logs"."request_id" IS 'Links to document_requests table - which request this log entry is for';
COMMENT ON COLUMN "public"."document_requests_logs"."action" IS 'Action performed: created, status_changed, assigned, completed, rejected, notes_added';
COMMENT ON COLUMN "public"."document_requests_logs"."old_status" IS 'Previous status before this action (integer: 0=pending, 1=processing, 2=rejected, 3=ready, 4=claimed, NULL for creation)';
COMMENT ON COLUMN "public"."document_requests_logs"."new_status" IS 'New status after this action (integer: 0=pending, 1=processing, 2=rejected, 3=ready, 4=claimed, NULL if no status change)';
COMMENT ON COLUMN "public"."document_requests_logs"."action_by" IS 'Which user performed this action (resident, staff, or admin)';
COMMENT ON COLUMN "public"."document_requests_logs"."action_notes" IS 'Details about the action taken - reason for status change, notes added, etc.';
COMMENT ON COLUMN "public"."document_requests_logs"."created_at" IS 'When this action was performed';

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert Document Catalog
INSERT INTO "document_catalog" ("title", "description", "filename", "fee", "is_active") VALUES
('Electrical Permit', 'Permit required for electrical installations and repairs in residential or commercial properties.', 'electrical_permit_template.docx', 500.00, 1),
('Fence Permit', 'Authorization to construct fences around residential or commercial properties within barangay jurisdiction.', 'fence_permit_template.docx', 500.00, 1),
('Excavation Permit', 'Permit for excavation activities including digging, construction foundations, and land development.', 'excavation_permit_template.docx', 500.00, 1),
('Barangay Clearance', 'Certificate indicating no pending cases or issues in the barangay. Required for employment and various transactions.', 'barangay_clearance_template.docx', 50.00, 1),
('Certificate of Indigency (Medical)', 'Document certifying indigent status specifically for medical assistance and healthcare support programs.', 'indigency_medical_template.docx', 0.00, 1),
('Certificate of Indigency (Financial)', 'Document certifying indigent status for financial assistance and social services programs.', 'indigency_financial_template.docx', 0.00, 1),
('Business Permit Clearance', 'Barangay clearance required for small business operations and business permit applications.', 'business_permit_template.docx', 0.00, 1);


-- Reset sequences
SELECT setval('document_catalog_id_seq', (SELECT MAX(id) FROM document_catalog));
SELECT setval('document_requests_id_seq', COALESCE((SELECT MAX(id) FROM document_requests), 1));
SELECT setval('document_requests_logs_id_seq', COALESCE((SELECT MAX(id) FROM document_requests_logs), 1));

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Documents Schema Complete!' AS status;
SELECT 'Next: Run 004-chatbot-schema.sql' AS next_step;
