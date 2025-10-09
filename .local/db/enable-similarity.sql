-- ============================================
-- ENABLE SIMILARITY FUNCTIONS
-- ============================================
-- Purpose: Enable pg_trgm extension for advanced text similarity functions
-- Run this as a superuser to enable similarity() function

-- Connect to your database
\c smartliasdb;

-- Enable required extensions for similarity functions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Test if similarity function works
SELECT similarity('hello world', 'hello earth');

-- Show enabled extensions
SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent');

-- ============================================
-- USAGE NOTES:
-- ============================================
-- 1. Run this script as a database superuser (postgres)
-- 2. If you don't have superuser access, the chatbot will automatically 
--    fall back to ILIKE-based text search
-- 3. similarity() function provides better text matching for chat history analysis
-- 4. Extension is optional - the system works without it
