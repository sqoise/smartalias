-- ============================================
-- MASTER DEPLOYMENT SCRIPT
-- ============================================
-- Purpose: Deploy all SmartLias database schema files in correct order
-- Run this as database superuser (postgres)

-- ============================================
-- DEPLOYMENT ORDER
-- ============================================
-- 000-create-users-and-database.sql  - Creates database and users
-- 001-core-tables.sql                - Core tables (users, residents, families)
-- 002-announcements-schema.sql       - Announcements and SMS system
-- 003-documents-schema.sql           - Document management system
-- 004-chatbot-schema.sql             - AI chatbot and FAQ system
-- 005-enable-similarity.sql          - Optional similarity functions

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

-- Option 1: Run individual files manually (RECOMMENDED)
-- psql -U postgres -f 000-create-users-and-database.sql
-- psql -U postgres -d smartliasdb -f 001-core-tables.sql
-- psql -U postgres -d smartliasdb -f 002-announcements-schema.sql
-- psql -U postgres -d smartliasdb -f 003-documents-schema.sql
-- psql -U postgres -d smartliasdb -f 004-chatbot-schema.sql
-- psql -U postgres -d smartliasdb -f 005-enable-similarity.sql

-- Option 2: Run all files at once (use with caution)
-- cat 000-*.sql 001-*.sql 002-*.sql 003-*.sql 004-*.sql 005-*.sql | psql -U postgres

-- ============================================
-- DEPLOYMENT CHECKLIST
-- ============================================

-- Before deployment:
-- [ ] Backup existing database (if applicable)
-- [ ] Review and update passwords in 000-create-users-and-database.sql
-- [ ] Ensure PostgreSQL version 12+ is installed
-- [ ] Verify postgres user has superuser privileges
-- [ ] Check that port 5432 is accessible

-- After deployment:
-- [ ] Verify all tables were created successfully
-- [ ] Check that foreign key constraints are in place
-- [ ] Test sample data insertion worked
-- [ ] Verify extensions are enabled (if 005-enable-similarity.sql was run)
-- [ ] Update application configuration with database credentials
-- [ ] Test application connectivity to database

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check foreign key constraints
-- SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY' ORDER BY tc.table_name, tc.constraint_name;

-- Check sample data counts
-- SELECT 'users' as table_name, count(*) as record_count FROM users
-- UNION ALL SELECT 'residents', count(*) FROM residents
-- UNION ALL SELECT 'special_categories', count(*) FROM special_categories
-- UNION ALL SELECT 'household', count(*) FROM household
-- UNION ALL SELECT 'document_catalog', count(*) FROM document_catalog
-- UNION ALL SELECT 'announcements', count(*) FROM announcements
-- UNION ALL SELECT 'faq_categories', count(*) FROM faq_categories
-- UNION ALL SELECT 'faqs', count(*) FROM faqs;

-- Check extensions (if 005-enable-similarity.sql was run)
-- SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent');

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Common Issues:

-- 1. Permission Denied:
--    Solution: Run as postgres superuser or grant CREATE privileges

-- 2. Database already exists:
--    Solution: Drop database first or comment out CREATE DATABASE line

-- 3. Extensions not available:
--    Solution: Install postgresql-contrib package or skip 005-enable-similarity.sql

-- 4. Foreign key constraint errors:
--    Solution: Check that referenced tables exist and have correct primary keys

-- 5. Sequence errors after manual inserts:
--    Solution: Run the setval() commands at the end of each schema file

-- ============================================
-- ENVIRONMENT-SPECIFIC NOTES
-- ============================================

-- Development Environment:
-- - Use default passwords for convenience
-- - Include all sample data
-- - Enable all extensions

-- Staging Environment:
-- - Use secure passwords
-- - Include minimal sample data
-- - Enable all extensions for testing

-- Production Environment:
-- - Use strong, unique passwords
-- - Review and customize sample data
-- - Enable extensions based on requirements
-- - Consider additional security hardening

-- ============================================
-- END OF MASTER DEPLOYMENT SCRIPT
-- ============================================
