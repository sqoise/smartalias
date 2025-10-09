-- ============================================
-- 001-CORE TABLES SCHEMA
-- ============================================
-- Purpose: Core SmartLias tables (users, residents, families, categories)
-- Dependencies: 000-create-users-and-database.sql
-- Tables: users, special_categories, household, residents

-- Connect to database
\c smartliasdb;

-- ============================================
-- CORE TABLE CREATION
-- ============================================

-- Drop existing tables (sequences will be dropped automatically)
DROP TABLE IF EXISTS "residents" CASCADE;
DROP TABLE IF EXISTS "special_categories" CASCADE;
DROP TABLE IF EXISTS "household" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Users table (Authentication and Access Control)
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

-- Special Categories table (Government Programs)
CREATE TABLE "public"."special_categories" (
    "id" SERIAL PRIMARY KEY,
    "category_code" character varying(50) NOT NULL,
    "category_name" character varying(100) NOT NULL,
    "description" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Household table (Family Groups)
CREATE TABLE "public"."household" (
    "id" SERIAL PRIMARY KEY,
    "household_name" character varying(255) NOT NULL,
    "household_role" integer,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Residents table (Comprehensive Resident Information)
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
    "created_by" integer
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

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
CREATE INDEX idx_residents_last_name ON public.residents USING btree (last_name);
CREATE INDEX idx_residents_first_name ON public.residents USING btree (first_name);
CREATE INDEX idx_residents_gender ON public.residents USING btree (gender);
CREATE INDEX idx_residents_civil_status ON public.residents USING btree (civil_status);
CREATE INDEX idx_residents_special_category ON public.residents USING btree (special_category_id);
CREATE INDEX idx_residents_is_active ON public.residents USING btree (is_active);
CREATE INDEX idx_residents_full_name ON public.residents USING btree (first_name, last_name);
CREATE INDEX idx_residents_created_by ON public.residents USING btree (created_by);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Residents foreign keys
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_user_id_fkey" 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_household_id_fkey" 
    FOREIGN KEY (household_id) REFERENCES household(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_special_category_id_fkey" 
    FOREIGN KEY (special_category_id) REFERENCES special_categories(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_created_by_fkey" 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE "public"."users" IS 'Authentication and registration table - contains login credentials and basic account info';
COMMENT ON TABLE "public"."special_categories" IS 'Lookup table for special resident categories (government programs, roles, etc.)';
COMMENT ON TABLE "public"."household" IS 'Family grouping table - groups residents into family units';
COMMENT ON TABLE "public"."residents" IS 'Comprehensive resident information and records - contains all detailed resident data';

-- ============================================
-- COLUMN COMMENTS
-- ============================================

-- Users Table Comments
COMMENT ON COLUMN "public"."users"."id" IS 'Primary key - unique identifier for user accounts';
COMMENT ON COLUMN "public"."users"."username" IS 'Unique login username - format: firstname.lastname (lowercase)';
COMMENT ON COLUMN "public"."users"."password" IS 'Bcrypt hashed password/PIN - 12 rounds of hashing for security';
COMMENT ON COLUMN "public"."users"."role" IS '1=Admin (full access), 2=Staff (limited admin), 3=Resident (user access)';
COMMENT ON COLUMN "public"."users"."created_at" IS 'Account creation timestamp - automatically set on INSERT';
COMMENT ON COLUMN "public"."users"."updated_at" IS 'Last modification timestamp - updated on any changes';
COMMENT ON COLUMN "public"."users"."is_password_changed" IS '0=must change password (admin-created), 1=password already changed (self-set)';
COMMENT ON COLUMN "public"."users"."failed_login_attempts" IS 'Counter for failed login attempts - locks account at 10 attempts';
COMMENT ON COLUMN "public"."users"."locked_until" IS 'Account lockout expiration time - NULL if not locked, 15 minutes from last failed attempt';
COMMENT ON COLUMN "public"."users"."last_login" IS 'Timestamp of last successful login - used for security tracking';
COMMENT ON COLUMN "public"."users"."last_failed_login" IS 'Timestamp of last failed login attempt - used for security tracking';

-- Special Categories Table Comments
COMMENT ON COLUMN "public"."special_categories"."id" IS 'Primary key - unique identifier for special categories';
COMMENT ON COLUMN "public"."special_categories"."category_code" IS 'Unique code identifier: PWD, SOLO_PARENT, INDIGENT, STUDENT, etc.';
COMMENT ON COLUMN "public"."special_categories"."category_name" IS 'Human-readable category name for display purposes';
COMMENT ON COLUMN "public"."special_categories"."description" IS 'Detailed explanation of category requirements and benefits';
COMMENT ON COLUMN "public"."special_categories"."created_at" IS 'Category creation timestamp';
COMMENT ON COLUMN "public"."special_categories"."updated_at" IS 'Last modification timestamp for category';

-- Household Table Comments
COMMENT ON COLUMN "public"."household"."id" IS 'Primary key - unique identifier for family units';
COMMENT ON COLUMN "public"."household"."household_name" IS 'Family surname or household name - typically "Lastname Family"';
COMMENT ON COLUMN "public"."household"."household_role" IS 'Household role identifier (if needed for hierarchy)';
COMMENT ON COLUMN "public"."household"."created_at" IS 'Family group creation timestamp';
COMMENT ON COLUMN "public"."household"."updated_at" IS 'Last modification timestamp for family group';

-- Residents Table Comments
COMMENT ON COLUMN "public"."residents"."id" IS 'Primary key - unique identifier for resident records';
COMMENT ON COLUMN "public"."residents"."user_id" IS 'One-to-one link to users table - NULL for residents without login accounts';
COMMENT ON COLUMN "public"."residents"."last_name" IS 'Family surname - required field, stored in uppercase';
COMMENT ON COLUMN "public"."residents"."first_name" IS 'Given first name - required field, stored in uppercase';
COMMENT ON COLUMN "public"."residents"."middle_name" IS 'Middle name or maternal surname - optional field';
COMMENT ON COLUMN "public"."residents"."suffix" IS 'Name suffix: Jr, Sr, III, IV, etc. - optional field';
COMMENT ON COLUMN "public"."residents"."birth_date" IS 'Date of birth - used for age calculation and senior citizen identification';
COMMENT ON COLUMN "public"."residents"."gender" IS '1=Male, 2=Female - used with family_role for relationship labels';
COMMENT ON COLUMN "public"."residents"."civil_status" IS 'Marital status: Single, Married, Widowed, Separated, Live-In - affects household analysis';
COMMENT ON COLUMN "public"."residents"."mobile_number" IS '11-digit mobile number format: 09XXXXXXXXX - primary contact method';
COMMENT ON COLUMN "public"."residents"."email" IS 'Email address - optional, used for digital communications';
COMMENT ON COLUMN "public"."residents"."address" IS 'Physical address within barangay - optional field for privacy reasons';
COMMENT ON COLUMN "public"."residents"."purok" IS 'Purok number (1-7) - geographical subdivision within barangay';
COMMENT ON COLUMN "public"."residents"."household_id" IS 'Groups residents into family units - same ID means same household';
COMMENT ON COLUMN "public"."residents"."religion" IS 'Religious affiliation: Catholic, Islam, Iglesia ni Cristo, Others - for demographic analysis';
COMMENT ON COLUMN "public"."residents"."occupation" IS 'Job or profession - free text field for employment tracking';
COMMENT ON COLUMN "public"."residents"."special_category_id" IS 'Links to special_categories table - NULL if no special classification';
COMMENT ON COLUMN "public"."residents"."notes" IS 'Additional information: PWD details, health conditions, special circumstances';
COMMENT ON COLUMN "public"."residents"."is_active" IS '1=active resident, 0=inactive/moved out - for record management';
COMMENT ON COLUMN "public"."residents"."created_at" IS 'Record creation timestamp - tracks when resident was first registered';
COMMENT ON COLUMN "public"."residents"."updated_at" IS 'Last modification timestamp - updated on any field changes';
COMMENT ON COLUMN "public"."residents"."home_number" IS '8-digit landline number format: 8XXX XXXX - optional contact info';
COMMENT ON COLUMN "public"."residents"."street" IS 'Street identifier or code - used for detailed address mapping';
COMMENT ON COLUMN "public"."residents"."created_by" IS 'User who created record: NULL=self-registration, user_id=admin-created';

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert Special Categories
INSERT INTO "special_categories" ("category_code", "category_name", "description") VALUES
('PWD', 'PWD', 'Residents with physical, mental, intellectual, or sensory disabilities'),
('SOLO_PARENT', 'Solo Parent', 'Single parents raising children alone'),
('INDIGENT', 'Indigent', 'Residents classified as indigent for social services'),
('STUDENT', 'Student', 'Currently enrolled in educational institution'),
('SENIOR_CITIZEN', 'Senior Citizen', 'Residents aged 60 and above');

-- Insert Sample Households
INSERT INTO "household" ("household_name") VALUES
('Macariola Family'),
('Ong Family'),
('Default Household');

-- Insert Sample Users
INSERT INTO "users" ("username", "password", "role", "is_password_changed") VALUES
('seed.admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVcj/YRZvzi', 1, 1),
('admin.kapitan', '$2a$12$Yy4q25XA7XypnDLE.3rAu.OZ8030fKLHdTbgiZ.K0upvmxyjrVVsS', 1, 0),
('jacob.manansala', '$2a$12$/8VHMaoBZ8YB1pxKYEv63u/ahlG8mqLnjMGq2ubGn/Sd/wfWJx1we', 3, 0),
('john.lloyd.manansala', '$2a$12$knWIZVOvQ5LSkHSrikgfP.TPXsE9sAnWagqdG4pu3FLw2GYB2XDoK', 3, 0);

-- Insert Sample Residents
INSERT INTO "residents" (
    "user_id", "first_name", "last_name", "middle_name", "birth_date", "gender", "civil_status",
    "mobile_number", "email", "address", "purok", "household_id", "religion", "occupation",
    "special_category_id", "notes", "created_by"
) VALUES
-- Admin user
(2, 'Juan', 'Kapitan', 'Dela Cruz', '1980-01-15', 1, 'Married', 
 NULL, 'admin.kapitan@smartlias.local', 'B1 L1 Burgos Street', 1, 3, 'Catholic', 'Barangay Captain',
 NULL, NULL, NULL),

-- Regular residents
(3, 'Jacob', 'Manansala', 'Santos', '2004-01-11', 1, 'Single',
 '09294838765', 'mj@example.com', '12 BLOCK ST. BRGY LIAS, MARILAO BULACAN', 3, 1, 'OTHERS', 'OTHERS',
 NULL, NULL, NULL),

(4, 'John Lloyd', 'Manansala', 'Santos', '1998-09-01', 1, 'Single',
 '09268939406', '08.soled.press@icloud.com', '13 Vidal St. Brgy Ibaba, Malabon City', 1, 1, NULL, NULL,
 (SELECT id FROM special_categories WHERE category_code = 'PWD'), NULL, NULL);

-- Reset sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('special_categories_id_seq', (SELECT MAX(id) FROM special_categories));
SELECT setval('household_id_seq', (SELECT MAX(id) FROM household));
SELECT setval('residents_id_seq', (SELECT MAX(id) FROM residents));

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Core Tables Schema Complete!' AS status;
SELECT 'Next: Run 002-announcements-schema.sql' AS next_step;
