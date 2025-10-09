-- ============================================
-- 002-ANNOUNCEMENTS SCHEMA
-- ============================================
-- Purpose: Announcements and SMS notification system
-- Dependencies: 001-core-tables.sql
-- Tables: announcements, announcement_sms_logs

-- Connect to database
\c smartliasdb;

-- ============================================
-- ANNOUNCEMENTS TABLES
-- ============================================

-- Drop existing tables
DROP TABLE IF EXISTS "announcement_sms_logs" CASCADE;
DROP TABLE IF EXISTS "announcements" CASCADE;

-- Announcements table (Barangay Communications)
CREATE TABLE "public"."announcements" (
    "id" SERIAL PRIMARY KEY,
    "title" character varying(255) NOT NULL,
    "content" text NOT NULL,
    "type" character varying(50) DEFAULT 'general',
    "created_by" integer,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "published_by" integer,
    "published_at" timestamp,
    "target_type" character varying(20),
    "target_value" character varying(100)
);

-- Announcement SMS Logs table (SMS Delivery Tracking)
CREATE TABLE "public"."announcement_sms_logs" (
    "id" SERIAL PRIMARY KEY,
    "announcement_id" integer,
    "target_groups" jsonb NOT NULL,
    "total_recipients" integer NOT NULL,
    "successful_sends" integer DEFAULT 0,
    "failed_sends" integer DEFAULT 0,
    "sms_content" text NOT NULL,
    "sent_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "provider_response" jsonb,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Announcements indexes
CREATE INDEX idx_announcements_type ON public.announcements USING btree (type);
CREATE INDEX idx_announcements_created_at ON public.announcements USING btree (created_at);
CREATE INDEX idx_announcements_published_at ON public.announcements USING btree (published_at);
CREATE INDEX idx_announcements_target ON public.announcements USING btree (target_type, target_value);

-- Announcement SMS Logs indexes
CREATE INDEX idx_announcement_sms_logs_announcement_id ON public.announcement_sms_logs USING btree (announcement_id);
CREATE INDEX idx_announcement_sms_logs_sent_at ON public.announcement_sms_logs USING btree (sent_at);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Announcements foreign keys
ALTER TABLE ONLY "public"."announcements" ADD CONSTRAINT "announcements_created_by_fkey" 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."announcements" ADD CONSTRAINT "announcements_published_by_fkey" 
    FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

-- Announcement SMS Logs foreign keys
ALTER TABLE ONLY "public"."announcement_sms_logs" ADD CONSTRAINT "announcement_sms_logs_announcement_id_fkey" 
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE NOT DEFERRABLE;

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE "public"."announcements" IS 'Barangay announcements and notifications with optional SMS targeting';
COMMENT ON TABLE "public"."announcement_sms_logs" IS 'SMS logs for announcements - tracks summary statistics per announcement instead of individual SMS records';

-- ============================================
-- COLUMN COMMENTS
-- ============================================

-- Announcements Table Comments
COMMENT ON COLUMN "public"."announcements"."id" IS 'Primary key - unique identifier for announcements';
COMMENT ON COLUMN "public"."announcements"."title" IS 'Announcement headline - appears in listings and notifications';
COMMENT ON COLUMN "public"."announcements"."content" IS 'Full announcement text content - supports basic formatting';
COMMENT ON COLUMN "public"."announcements"."type" IS 'Announcement category: general, health, activities, assistance, advisory';
COMMENT ON COLUMN "public"."announcements"."created_by" IS 'User who created the announcement - links to users table';
COMMENT ON COLUMN "public"."announcements"."created_at" IS 'Announcement creation timestamp - when draft was first created';
COMMENT ON COLUMN "public"."announcements"."updated_at" IS 'Last modification timestamp - updated on content changes';
COMMENT ON COLUMN "public"."announcements"."published_by" IS 'User who published the announcement - NULL if still draft';
COMMENT ON COLUMN "public"."announcements"."published_at" IS 'Publication timestamp - NULL=draft, NOT NULL=published and live';
COMMENT ON COLUMN "public"."announcements"."target_type" IS 'SMS targeting: NULL=no SMS, "all"=SMS all, "special_category"=specific group';
COMMENT ON COLUMN "public"."announcements"."target_value" IS 'SMS target value: NULL for "all", category code for specific groups';

-- Announcement SMS Logs Table Comments
COMMENT ON COLUMN "public"."announcement_sms_logs"."id" IS 'Primary key - unique identifier for SMS log entries';
COMMENT ON COLUMN "public"."announcement_sms_logs"."announcement_id" IS 'Links to announcements table - which announcement was sent via SMS';
COMMENT ON COLUMN "public"."announcement_sms_logs"."target_groups" IS 'JSON array of target groups: ["all"] or ["special_category:PWD"]';
COMMENT ON COLUMN "public"."announcement_sms_logs"."total_recipients" IS 'Total number of residents who should receive SMS';
COMMENT ON COLUMN "public"."announcement_sms_logs"."successful_sends" IS 'Number of SMS messages successfully delivered';
COMMENT ON COLUMN "public"."announcement_sms_logs"."failed_sends" IS 'Number of SMS messages that failed to deliver';
COMMENT ON COLUMN "public"."announcement_sms_logs"."sms_content" IS 'Actual SMS message text that was sent to recipients';
COMMENT ON COLUMN "public"."announcement_sms_logs"."sent_at" IS 'Timestamp when SMS batch was sent to provider';
COMMENT ON COLUMN "public"."announcement_sms_logs"."provider_response" IS 'JSON response from SMS provider (IProg API response)';
COMMENT ON COLUMN "public"."announcement_sms_logs"."created_at" IS 'SMS log entry creation timestamp';

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert Sample Announcements
INSERT INTO "announcements" ("title", "content", "type", "created_by", "published_by", "published_at", "target_type", "target_value") VALUES
-- Published announcements
('Community Clean-Up Drive', 'Join us this Saturday for our monthly community clean-up drive. Let''s work together to keep our barangay clean and green. Bring your gloves and cleaning materials!', 'activities', 1, 1, '2025-08-15 16:00:00', NULL, NULL),

('Free Health Check-Up', 'The barangay health center is offering free health check-ups and vaccinations for all residents this Friday from 8 AM to 5 PM. Bring your health card and valid ID.', 'health', 1, 1, '2025-07-22 17:00:00', NULL, NULL),

('Water Interruption Advisory', 'Water supply will be temporarily interrupted tomorrow from 9 AM to 3 PM for emergency pipe repairs. Please store enough water for your needs.', 'advisory', 1, 1, '2025-10-03 23:00:00', NULL, NULL),

('Senior Citizens Cash Assistance Program', 'Senior citizens are reminded to claim their quarterly cash assistance at the barangay office. Bring your senior citizen ID and barangay clearance.', 'assistance', 1, 1, '2025-08-05 21:00:00', 'special_category', 'SENIOR_CITIZEN'),

('Basketball Tournament Registration', 'Basketball tournament registration is now open! Teams must register by December 20th. Maximum of 12 players per team. Contact the barangay sports coordinator.', 'activities', 1, 1, '2025-09-15 19:00:00', NULL, NULL),

-- Draft announcements (not published yet)
('New Year Celebration Guidelines', 'Guidelines for New Year celebration: No firecrackers allowed. Community fireworks display will be held at the barangay plaza. Let''s celebrate safely!', 'activities', 1, NULL, NULL, NULL, NULL),

('Tax Declaration Reminder', 'Reminder to all property owners: Real property tax declarations are due by December 31st. Visit the municipal treasury office for payment.', 'general', 1, NULL, NULL, NULL, NULL);

-- Reset sequence
SELECT setval('announcements_id_seq', (SELECT MAX(id) FROM announcements));
SELECT setval('announcement_sms_logs_id_seq', 1);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Announcements Schema Complete!' AS status;
SELECT 'Next: Run 003-documents-schema.sql' AS next_step;
