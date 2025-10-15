-- ============================================
-- 005-ENABLE SIMILARITY FUNCTIONS
-- ============================================
-- Purpose: Enable pg_trgm extension for advanced text similarity functions
-- Dependencies: 004-chatbot-schema.sql
-- Optional: Run only if you want advanced similarity search for chatbot

-- Connect to database
\c smartliasdb;

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

-- Enable required extensions for similarity functions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================
-- ADDITIONAL INDEXES FOR SIMILARITY SEARCH
-- ============================================

-- Add GIN indexes for similarity search on chat messages
CREATE INDEX idx_chat_messages_message_text_gin ON chat_messages USING gin (message_text gin_trgm_ops);

-- Add GIN indexes for FAQ search
CREATE INDEX idx_faqs_question_gin ON faqs USING gin (question gin_trgm_ops);
CREATE INDEX idx_faqs_keywords_gin ON faqs USING gin (keywords gin_trgm_ops);

-- ============================================
-- TEST SIMILARITY FUNCTION
-- ============================================

-- Test if similarity function works
SELECT similarity('hello world', 'hello earth') AS similarity_test;

-- Show enabled extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_trgm', 'unaccent') 
ORDER BY extname;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Similarity Functions Enabled!' AS status;
SELECT 'All schema files deployed successfully!' AS final_status;

-- ============================================
-- USAGE NOTES
-- ============================================
-- 1. pg_trgm extension provides similarity() function for text matching
-- 2. unaccent extension helps with accent-insensitive text search
-- 3. GIN indexes enable fast similarity searches on large text datasets
-- 4. If this script fails due to permissions, the chatbot will automatically
--    fall back to ILIKE-based text search
-- 5. Extension is optional - the system works without it but with reduced
--    text matching capabilities
