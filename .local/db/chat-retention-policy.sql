-- ============================================
-- CHAT DATA RETENTION POLICY
-- ============================================
-- Purpose: Automatically purge chat data after 30 days
-- Benefits: Privacy compliance, storage optimization, GDPR-like practices

-- ============================================
-- ADD RETENTION COLUMNS
-- ============================================

-- Add auto-purge timestamp to conversations
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS purge_after TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- Add auto-purge timestamp to messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS purge_after TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- ============================================
-- CREATE ANALYTICS SUMMARY TABLE
-- ============================================
-- Keep aggregated data for insights without storing personal chat logs

CREATE TABLE IF NOT EXISTS chat_analytics (
    id SERIAL PRIMARY KEY,
    query_date DATE NOT NULL,
    query_category VARCHAR(50), -- 'documents', 'services', 'contact', etc.
    response_type VARCHAR(20) NOT NULL, -- 'faq', 'ai', 'fallback'
    was_helpful BOOLEAN DEFAULT NULL,
    response_time_ms INTEGER DEFAULT NULL,
    total_queries INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_analytics_date ON chat_analytics(query_date);
CREATE INDEX idx_chat_analytics_category ON chat_analytics(query_category);
CREATE INDEX idx_chat_analytics_type ON chat_analytics(response_type);

-- ============================================
-- PURGE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION purge_old_chat_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_messages INTEGER;
    deleted_conversations INTEGER;
BEGIN
    -- Delete old messages first (foreign key constraint)
    DELETE FROM chat_messages 
    WHERE purge_after < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_messages = ROW_COUNT;
    
    -- Delete old conversations
    DELETE FROM chat_conversations 
    WHERE purge_after < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_conversations = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO chat_analytics (query_date, query_category, response_type, total_queries)
    VALUES (CURRENT_DATE, 'system', 'cleanup', deleted_messages + deleted_conversations);
    
    RETURN deleted_messages + deleted_conversations;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED CLEANUP (Manual)
-- ============================================
-- Run this daily/weekly to clean up old chat data
-- Can be automated with pg_cron extension or external cron job

-- Example cleanup command:
-- SELECT purge_old_chat_data();

-- ============================================
-- MIGRATION SCRIPT (One-time)
-- ============================================
-- Migrate existing data to set purge dates

-- Update existing conversations (30 days from creation)
UPDATE chat_conversations 
SET purge_after = started_at + INTERVAL '30 days'
WHERE purge_after IS NULL;

-- Update existing messages (30 days from creation)
UPDATE chat_messages 
SET purge_after = created_at + INTERVAL '30 days'
WHERE purge_after IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check data ready for purging
SELECT 
    'Messages ready for purge' AS type,
    COUNT(*) AS count,
    MIN(created_at) AS oldest,
    MAX(created_at) AS newest
FROM chat_messages 
WHERE purge_after < CURRENT_TIMESTAMP
UNION ALL
SELECT 
    'Conversations ready for purge' AS type,
    COUNT(*) AS count,
    MIN(started_at) AS oldest,
    MAX(started_at) AS newest
FROM chat_conversations 
WHERE purge_after < CURRENT_TIMESTAMP;

-- Check total chat data size
SELECT 
    'Current chat messages' AS type,
    COUNT(*) AS count,
    pg_size_pretty(pg_total_relation_size('chat_messages')) AS size
UNION ALL
SELECT 
    'Current chat conversations' AS type,
    COUNT(*) AS count,
    pg_size_pretty(pg_total_relation_size('chat_conversations')) AS size;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION purge_old_chat_data() IS 'Automatically purge chat conversations and messages older than 30 days';
COMMENT ON TABLE chat_analytics IS 'Anonymized chat analytics for insights without storing personal data';
COMMENT ON COLUMN chat_conversations.purge_after IS 'Automatic purge date - 30 days from creation';
COMMENT ON COLUMN chat_messages.purge_after IS 'Automatic purge date - 30 days from creation';

-- ============================================
-- COMPLETION
-- ============================================

SELECT 'Chat retention policy implemented successfully!' AS status;
SELECT 'Run SELECT purge_old_chat_data(); to clean up old data' AS next_step;
