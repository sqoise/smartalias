-- ============================================
-- 004-USER-VERIFICATION-MIGRATION
-- ============================================
-- Purpose: Add document verification fields to users table
-- Dependencies: 001-core-tables.sql
-- Description: Adds approval workflow for resident account verification

-- Connect to database
\c smartliasdb;

-- ============================================
-- ADD NEW COLUMNS TO USERS TABLE
-- ============================================

-- Add new columns for document verification
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "is_active" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "attachment_image" character varying(512),
ADD COLUMN IF NOT EXISTS "approval_status" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "approved_by" integer,
ADD COLUMN IF NOT EXISTS "approved_at" timestamp;

-- ============================================
-- CREATE NEW INDEXES
-- ============================================

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON public.users USING btree (approval_status);
CREATE INDEX IF NOT EXISTS idx_users_approved_by ON public.users USING btree (approved_by);

-- ============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add foreign key for approved_by (self-referencing to users table)
ALTER TABLE ONLY "public"."users" 
ADD CONSTRAINT IF NOT EXISTS "users_approved_by_fkey" 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

-- ============================================
-- ADD COLUMN COMMENTS
-- ============================================

-- Add comments for new columns
COMMENT ON COLUMN "public"."users"."is_active" IS '0=pending approval, 1=approved and active, 2=rejected, 3=suspended';
COMMENT ON COLUMN "public"."users"."attachment_image" IS 'File path to resident ID document - format: <user_id>_access_<random8>.jpg';
COMMENT ON COLUMN "public"."users"."approval_status" IS '0=pending approval, 1=approved, 2=rejected - requires admin review';
COMMENT ON COLUMN "public"."users"."approved_by" IS 'Admin user ID who approved/rejected the account - NULL if pending';
COMMENT ON COLUMN "public"."users"."approved_at" IS 'Timestamp when account was approved/rejected - NULL if pending';

-- ============================================
-- UPDATE EXISTING DATA
-- ============================================

-- Set existing admin and staff users as approved
UPDATE "public"."users" 
SET 
  is_active = 1,
  approval_status = 1,
  approved_at = CURRENT_TIMESTAMP
WHERE role IN (1, 2); -- Admin and Staff roles

-- Set existing resident users as approved (for existing accounts)
UPDATE "public"."users" 
SET 
  is_active = 1,
  approval_status = 1,
  approved_at = CURRENT_TIMESTAMP
WHERE role = 3; -- Resident role

-- ============================================
-- CREATE UPLOADS DIRECTORY CHECK FUNCTION
-- ============================================

-- Create a function to document the uploads directory requirement
CREATE OR REPLACE FUNCTION check_uploads_directory() 
RETURNS text AS $$
BEGIN
  RETURN 'Ensure uploads directory exists at: <project_root>/uploads/';
END;
$$ LANGUAGE plpgsql;

-- Add comment about uploads directory
COMMENT ON FUNCTION check_uploads_directory() IS 'Reminder: Create uploads directory at project root for document storage';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify the migration was successful
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
  COUNT(CASE WHEN approval_status = 0 THEN 1 END) as pending_approval,
  COUNT(CASE WHEN approval_status = 1 THEN 1 END) as approved_users,
  COUNT(CASE WHEN approval_status = 2 THEN 1 END) as rejected_users
FROM users;

-- Show the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('is_active', 'attachment_image', 'approval_status', 'approved_by', 'approved_at')
ORDER BY ordinal_position;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'User Verification Migration Complete!' AS status;
SELECT 'Remember to:' AS reminder;
SELECT '1. Create uploads directory: mkdir -p uploads' AS step_1;
SELECT '2. Set proper permissions: chmod 755 uploads' AS step_2;
SELECT '3. Update authentication middleware to check approval status' AS step_3;
SELECT '4. Test file upload functionality' AS step_4;
