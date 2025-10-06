-- ====================================================================
-- SMARTLIAS DATABASE EXPORT
-- Generated: 2025-10-06 13:35:53 UTC
-- Adminer 5.0.6 PostgreSQL 16.10 dump
-- ====================================================================

-- Drop existing database if exists (optional)
DROP DATABASE IF EXISTS smartliasdb;

-- Create database (run this separately if needed)
CREATE DATABASE smartliasdb WITH ENCODING 'UTF8';

-- ============================================
-- DATABASE CONFIGURATION
-- ============================================

-- Set timezone to Philippines (Manila)
ALTER DATABASE smartliasdb SET timezone TO 'Asia/Manila';

-- Apply timezone setting to current session
SET timezone TO 'Asia/Manila';

-- ============================================
-- DISPLAY TIMEZONE CONFIRMATION
-- ============================================
SELECT 'Database timezone set to: ' || current_setting('timezone') AS timezone_status;

-- ============================================
-- USER CREATION AND PRIVILEGES
-- ============================================

-- Create application user for SmartLias
-- NOTE: You need to set a password after running this script
CREATE USER smartlias_app_su WITH
    CREATEDB
    CREATEROLE
    LOGIN
    REPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'admin123';

-- Set password
ALTER USER smartlias_app_su PASSWORD '';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE smartliasdb TO smartlias_app_su;
-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO smartlias_app_su;
-- Grant all privileges on all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartlias_app_su;
-- Grant all privileges on all sequences in public schema  
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smartlias_app_su;
-- Grant privileges on future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO smartlias_app_su;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON SEQUENCES TO smartlias_app_su;
-- Make smartlias_app_su the owner of the database for full control
ALTER DATABASE smartliasdb OWNER TO smartlias_app_su;

\connect "smartliasdb";

-- ====================================================================
-- SECTION 1: TABLE CREATION
-- ====================================================================

-- Drop existing tables (sequences will be dropped automatically)
DROP TABLE IF EXISTS "announcement_sms_logs";
DROP TABLE IF EXISTS "announcements";
DROP TABLE IF EXISTS "residents";
DROP TABLE IF EXISTS "special_categories";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "household";

-- Users table
CREATE TABLE "public"."users" (
    "id" SERIAL PRIMARY KEY,
    "username" character varying(256) NOT NULL,
    "password" character varying(256) NOT NULL,
    "role" integer DEFAULT 3,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "is_password_changed" integer DEFAULT 0,
    "failed_login_attempts" integer DEFAULT 0,
    "locked_until" timestamp,
    "last_login" timestamp,
    "last_failed_login" timestamp
);

-- Special Categories table
CREATE TABLE "public"."special_categories" (
    "id" SERIAL PRIMARY KEY,
    "category_code" character varying(50) NOT NULL,
    "category_name" character varying(100) NOT NULL,
    "description" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Household table (referenced in inserts)
CREATE TABLE "public"."household" (
    "id" SERIAL PRIMARY KEY,
    "household_name" character varying(255) NOT NULL,
    "household_role" integer,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Residents table
CREATE TABLE "public"."residents" (
    "id" SERIAL PRIMARY KEY,
    "user_id" integer,
    "last_name" character varying(256) NOT NULL,
    "first_name" character varying(256) NOT NULL,
    "middle_name" character varying(256),
    "suffix" character varying(50),
    "birth_date" date,
    "gender" integer,
    "civil_status" character varying(50),
    "mobile_number" character varying(20),
    "email" character varying(256),
    "address" text,
    "purok" integer,
    "household_id" integer,
    "religion" character varying(50) DEFAULT 'Catholic',
    "occupation" character varying(256),
    "special_category_id" integer,
    "notes" text,
    "is_active" integer DEFAULT 1,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "home_number" character varying(20),
    "street" integer,
    "created_by" integer,
    CONSTRAINT "residents_family_role_check" CHECK ((family_role = ANY (ARRAY[1, 2])))
);

-- Announcements table
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

-- Announcement SMS Logs table
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

-- ====================================================================
-- SECTION 2: DATA INSERTS
-- ====================================================================

-- Insert Users
INSERT INTO "users" ("id", "username", "password", "role", "created_at", "updated_at", "is_password_changed", "failed_login_attempts", "locked_until", "last_login", "last_failed_login") VALUES
(13,	'arrene.bernardo',	'$2a$12$KHoMSF7tefmmOqVXo6/Tf..1n/ZnQlAeBahoHUlc8SY0rfAUru64e',	3,	'2025-10-05 23:41:57.836941',	'2025-10-05 23:41:57.836941',	0,	0,	NULL,	NULL,	NULL),
(9,	'jacob.manansala',	'$2a$12$/8VHMaoBZ8YB1pxKYEv63u/ahlG8mqLnjMGq2ubGn/Sd/wfWJx1we',	3,	'2025-10-04 03:49:19.855388',	'2025-10-04 03:49:19.855388',	0,	0,	NULL,	NULL,	NULL),
(10,	'john lloyd.manansala',	'$2a$12$knWIZVOvQ5LSkHSrikgfP.TPXsE9sAnWagqdG4pu3FLw2GYB2XDoK',	3,	'2025-10-04 04:01:26.103034',	'2025-10-04 04:01:26.103034',	0,	0,	NULL,	NULL,	NULL),
(6,	'admin.kapitan',	'$2a$12$Yy4q25XA7XypnDLE.3rAu.OZ8030fKLHdTbgiZ.K0upvmxyjrVVsS',	1,	'2025-10-03 23:36:48.863255',	'2025-10-06 20:29:21.163029',	0,	0,	NULL,	'2025-10-06 12:29:21.159',	'2025-10-05 09:07:03.885'),
(1,	'seed.admin',	'$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVcj/YRZvzi',	1,	'2025-10-05 16:40:07.191133',	'2025-10-05 16:40:07.191133',	1,	0,	NULL,	NULL,	NULL);

-- Insert Special Categories
INSERT INTO "special_categories" ("id", "category_code", "category_name", "description", "created_at", "updated_at") VALUES
(3,	'SOLO_PARENT',	'Solo Parent',	'Single parents raising children alone',	'2025-10-03 23:14:15.805248',	'2025-10-03 23:14:15.805248'),
(5,	'STUDENT',	'Student',	'Currently enrolled in educational institution',	'2025-10-03 23:14:15.805248',	'2025-10-03 23:14:15.805248'),
(6,	'INDIGENT',	'Indigent',	'Residents classified as indigent for social services',	'2025-10-06 17:51:07.045482',	'2025-10-06 17:51:07.045482'),
(2,	'PWD',	'Person with Disability (PWD)',	'Residents with physical, mental, intellectual, or sensory disabilities',	'2025-10-03 23:14:15.805248',	'2025-10-03 23:14:15.805248');

-- Insert Household
INSERT INTO "household" ("id", "household_name", "created_at", "updated_at") VALUES
(1,	'Macariola Family',	'2025-10-03 23:14:15.806254',	'2025-10-03 23:14:15.806254'),
(2,	'Ong Family',	'2025-10-03 23:14:15.806254',	'2025-10-03 23:14:15.806254');

-- Insert Residents
INSERT INTO "residents" ("id", "user_id", "last_name", "first_name", "middle_name", "suffix", "birth_date", "gender", "civil_status", "mobile_number", "email", "address", "purok", "household_id", "family_role", "religion", "occupation", "special_category_id", "notes", "is_active", "created_at", "updated_at", "home_number", "street", "created_by") VALUES
(2,	9,	'Manansala',	'Jacob',	'Santos',	NULL,	'2004-01-11',	1,	'Single',	'09294838765',	'mj@example.com',	'12 BLOCK ST. BRGY LIAS, MARILAO BULACAN',	3,	NULL,	NULL,	'OTHERS',	'OTHERS',	NULL,	NULL,	1,	'2025-10-04 03:49:19.864176',	'2025-10-04 03:49:19.864176',	NULL,	NULL,	NULL),
(6,	13,	'Bernardo',	'Jess',	'Santos',	NULL,	'2022-02-02',	2,	'Married',	'09067268602',	NULL,	'23K Gervacio St Brgy Lias, Marilao Bulacan',	7,	NULL,	NULL,	'ROMAN_CATHOLIC',	'RETIRED',	NULL,	NULL,	1,	'2025-10-05 23:41:57.848304',	'2025-10-05 23:41:57.848304',	NULL,	NULL,	NULL),
(1,	6,	'Kapitan',	'Juan',	'Dela Cruz',	NULL,	'1980-01-15',	1,	'Married',	NULL,	'admin.kapitan@smartlias.local',	'B1 L1 Burgos Street',	1,	NULL,	NULL,	'Catholic',	'Barangay Captain',	NULL,	NULL,	1,	'2025-10-03 23:39:10.868217',	'2025-10-03 23:39:10.868217',	NULL,	NULL,	NULL),
(3,	10,	'Manansala',	'John Lloyd',	'Santos',	NULL,	'1998-09-01',	1,	'Single',	'09268939406',	'08.soled.press@icloud.com',	'13 Vidal St. Brgy Ibaba, Malabon City',	1,	NULL,	NULL,	NULL,	NULL,	2,	NULL,	1,	'2025-10-04 04:01:26.109413',	'2025-10-04 04:01:26.109413',	NULL,	NULL,	NULL);

-- Insert Announcements
INSERT INTO "announcements" ("id", "title", "content", "type", "created_by", "created_at", "updated_at", "published_by", "published_at", "target_type", "target_value") VALUES
(74,	'Ayudan 3rd Tranche',	'Announcement! Dumating na po ang ayuda para sa 3rd tranche.',	'4',	6,	'2025-10-06 17:22:24.906352',	'2025-10-06 18:13:00.928',	6,	'2025-10-06 18:13:00.928',	NULL,	NULL),
(51,	'Community Clean-Up Drive',	'Join us this Saturday for our monthly community clean-up drive. Let''s work together to keep our barangay clean and green. Bring your gloves and cleaning materials!',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-08-15 16:00:00',	NULL,	NULL),
(52,	'Free Health Check-Up',	'The barangay health center is offering free health check-ups and vaccinations for all residents this Friday from 8 AM to 5 PM. Bring your health card and valid ID.',	'2',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-07-22 17:00:00',	NULL,	NULL),
(53,	'Water Interruption Advisory',	'Water supply will be temporarily interrupted tomorrow from 9 AM to 3 PM for emergency pipe repairs. Please store enough water for your needs.',	'5',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-10-03 23:00:00',	NULL,	NULL),
(54,	'Christmas Celebration Planning Meeting',	'All residents are invited to attend the Christmas celebration planning meeting on December 15th at the barangay hall. Your ideas and participation are welcome!',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-28 18:00:00',	NULL,	NULL),
(56,	'Senior Citizens Cash Assistance Program',	'Senior citizens are reminded to claim their quarterly cash assistance at the barangay hall. Bring your senior citizen ID and barangay clearance.',	'4',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-08-05 21:00:00',	NULL,	NULL),
(57,	'Typhoon Preparedness Advisory',	'A typhoon is expected to affect our area this weekend. Please secure your properties and prepare emergency kits. Evacuation center is ready at the barangay hall.',	'5',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-10-01 15:00:00',	NULL,	NULL),
(58,	'Barangay Assembly Meeting',	'Quarterly barangay assembly meeting will be held on December 18th at 2 PM. All household representatives are required to attend. Important matters will be discussed.',	'1',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-10 22:00:00',	NULL,	NULL),
(59,	'Job Fair Announcement',	'A job fair will be held at the barangay covered court on December 22nd. Various companies will be accepting applications. Bring your resume and valid IDs.',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-05 18:00:00',	NULL,	NULL),
(60,	'Garbage Collection Schedule Update',	'New garbage collection schedule: Biodegradable waste on Mondays and Thursdays, Non-biodegradable on Tuesdays and Fridays. Recyclables on Saturdays.',	'1',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-07-10 16:00:00',	NULL,	NULL),
(61,	'Free Skills Training Workshop',	'Free cooking and baking workshop for interested residents. Limited slots available. Register at the barangay hall until December 16th. Materials provided.',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-06-25 17:30:00',	NULL,	NULL),
(62,	'Road Closure Advisory',	'Main road will be closed for repairs from December 14-16. Use alternate routes via Purok 3 and Purok 5. Heavy vehicles are not allowed.',	'5',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-21 00:00:00',	NULL,	NULL),
(63,	'Youth Development Program',	'Calling all youth ages 15-21! Join our youth development program featuring leadership training, sports activities, and educational workshops. Registration ongoing.',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-08-30 19:00:00',	NULL,	NULL),
(55,	'Basketball Tournament Registration',	'Basketball tournament registration is now open! Teams must register by December 20th. Maximum of 12 players per team. Contact the barangay sports coordinator.',	'3',	1,	'2025-09-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-15 19:00:00',	NULL,	NULL),
(75,	'Ayuda 4th Tranche',	'Announcement! Dumating na po ang ayuda para sa 4th Tranche.',	'1',	6,	'2025-10-06 18:41:48.458084',	'2025-10-06 18:49:43.605',	6,	'2025-10-06 18:49:43.605',	'multiple',	'["special_category:PWD","special_category:SENIOR_CITIZEN"]'),
(64,	'Tax Declaration Reminder',	'Reminder to all property owners: Real property tax declarations are due by December 31st. Visit the municipal treasury office for payment.',	'1',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	NULL,	NULL,	NULL,	NULL),
(65,	'New Year Celebration Guidelines',	'Guidelines for New Year celebration: No firecrackers allowed. Community fireworks display will be held at the barangay plaza. Let''s celebrate safely!',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	NULL,	NULL,	NULL,	NULL),
(72,	'Ayuda 2nd Tranche',	'Announcement! Dumating napo ang ayuda para sa mga walang pera. Bumisita po sa ating barangay office upang kumuha ng ayuda. Maraming Salamat po.',	'1',	6,	'2025-10-06 10:29:54.850391',	'2025-10-06 18:13:15.127',	6,	'2025-10-06 18:13:15.127',	NULL,	NULL);

-- ====================================================================
-- SECTION 3: COMMENTS, INDEXES, AND CONSTRAINTS
-- ====================================================================

-- Table Comments
COMMENT ON TABLE "public"."users" IS 'Authentication and registration table - contains login credentials and basic account info';
COMMENT ON TABLE "public"."special_categories" IS 'Lookup table for special resident categories (government programs, roles, etc.)';
COMMENT ON TABLE "public"."announcement_sms_logs" IS 'Simplified SMS logging per announcement (batch summary instead of per-recipient tracking)';
COMMENT ON TABLE "public"."announcements" IS 'Barangay announcements and notifications with optional image support';

-- Column Comments
COMMENT ON COLUMN "public"."users"."role" IS '1=Admin, 2=Staff, 3=Resident (default for resident registration)';
COMMENT ON COLUMN "public"."residents"."created_by" IS 'NULL=system_generated (registration), user_id=admin created';
COMMENT ON COLUMN "public"."announcements"."published_by" IS 'User who published (may differ from created_by for approval workflows)';
COMMENT ON COLUMN "public"."announcements"."published_at" IS 'Publication timestamp: NULL = draft, NOT NULL = published';
COMMENT ON COLUMN "public"."announcements"."target_type" IS 'SMS indicator: NULL = SMS OFF, "all" = SMS to all residents, "special_category" = specific group, etc.';
COMMENT ON COLUMN "public"."announcements"."target_value" IS 'SMS target value (e.g., "PWD" for special_category, "18-65" for age_group, NULL for "all")';
COMMENT ON COLUMN "public"."announcement_sms_logs"."total_recipients" IS 'Total number of recipients who should receive the SMS';
COMMENT ON COLUMN "public"."announcement_sms_logs"."successful_sends" IS 'Number of SMS messages successfully sent';
COMMENT ON COLUMN "public"."announcement_sms_logs"."failed_sends" IS 'Number of SMS messages that failed to send';
COMMENT ON COLUMN "public"."announcement_sms_logs"."provider_response" IS 'JSON response from SMS provider for debugging';

-- Create Indexes
-- Users indexes
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);
CREATE INDEX idx_users_username ON public.users USING btree (username);
CREATE INDEX idx_users_role ON public.users USING btree (role);

-- Special Categories indexes
CREATE UNIQUE INDEX special_categories_category_code_key ON public.special_categories USING btree (category_code);
CREATE INDEX idx_special_categories_code ON public.special_categories USING btree (category_code);

-- Residents indexes
CREATE UNIQUE INDEX residents_user_id_key ON public.residents USING btree (user_id);
CREATE INDEX idx_residents_user_id ON public.residents USING btree (user_id);
CREATE INDEX idx_residents_purok ON public.residents USING btree (purok);
CREATE INDEX idx_residents_household_id ON public.residents USING btree (household_id);
CREATE INDEX idx_residents_family_role ON public.residents USING btree (family_role);
CREATE INDEX idx_residents_last_name ON public.residents USING btree (last_name);
CREATE INDEX idx_residents_first_name ON public.residents USING btree (first_name);
CREATE INDEX idx_residents_gender ON public.residents USING btree (gender);
CREATE INDEX idx_residents_civil_status ON public.residents USING btree (civil_status);
CREATE INDEX idx_residents_special_category ON public.residents USING btree (special_category_id);
CREATE INDEX idx_residents_is_active ON public.residents USING btree (is_active);
CREATE INDEX idx_residents_full_name ON public.residents USING btree (first_name, last_name);
CREATE INDEX idx_residents_created_by ON public.residents USING btree (created_by);

-- Announcements indexes
CREATE INDEX idx_announcements_type ON public.announcements USING btree (type);
CREATE INDEX idx_announcements_created_at ON public.announcements USING btree (created_at);
CREATE INDEX idx_announcements_published_at ON public.announcements USING btree (published_at);
CREATE INDEX idx_announcements_target ON public.announcements USING btree (target_type, target_value);

-- Announcement SMS Logs indexes
CREATE INDEX idx_announcement_sms_logs_announcement_id ON public.announcement_sms_logs USING btree (announcement_id);
CREATE INDEX idx_announcement_sms_logs_sent_at ON public.announcement_sms_logs USING btree (sent_at);

-- Foreign Key Constraints
ALTER TABLE ONLY "public"."announcement_sms_logs" ADD CONSTRAINT "announcement_sms_logs_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."announcements" ADD CONSTRAINT "announcements_published_by_fkey" FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_household_id_fkey" FOREIGN KEY (household_id) REFERENCES household(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_special_category_id_fkey" FOREIGN KEY (special_category_id) REFERENCES special_categories(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT DEFERRABLE;

-- ====================================================================
-- END OF DATABASE EXPORT
-- ====================================================================
