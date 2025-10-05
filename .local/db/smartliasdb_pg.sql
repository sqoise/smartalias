-- SmartLias PostgreSQL Database Schema
-- Converted from MySQL/MariaDB to PostgreSQL
-- Generation Date: September 18, 2025
-- Compatible with PostgreSQL 12+

-- Drop existing database if exists (optional)
DROP DATABASE IF EXISTS smartliasdb;

-- Create database (run this separately if needed)
CREATE DATABASE smartliasdb WITH ENCODING 'UTF8';

-- Connect to database
\c smartliasdb;

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
-- USERS TABLE
-- ============================================
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(256) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,
    role INTEGER DEFAULT 3, -- 1=Admin, 2=Staff, 3=Resident
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Password change tracking
    -- 0 = Must change password (default/generated PIN from admin)
    -- 1 = Password already changed (user chose their own PIN or changed default)
    -- Used for: Registration (set to 1), Admin-created accounts (set to 0), Admin password reset (set to 0)
    is_password_changed INTEGER DEFAULT 0,
    -- Login security tracking (10 attempts allowed before account lockout)
    failed_login_attempts INTEGER DEFAULT 0,  -- Increments on wrong PIN, resets to 0 on successful login, locks at 10
    locked_until TIMESTAMP DEFAULT NULL,      -- Account locked until this time (NULL = not locked), 15 minutes lockout
    last_login TIMESTAMP DEFAULT NULL,        -- Last successful login timestamp
    last_failed_login TIMESTAMP DEFAULT NULL  -- Last failed login attempt timestamp
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- RESIDENTS TABLE
-- ============================================
DROP TABLE IF EXISTS residents CASCADE;

CREATE TABLE residents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- One-to-one relationship
    
    -- Personal Information
    last_name VARCHAR(256) NOT NULL,
    first_name VARCHAR(256) NOT NULL,
    middle_name VARCHAR(256),
    suffix VARCHAR(50), -- Jr, Sr, III, etc.
    birth_date DATE,
    gender INTEGER, -- 1=Male, 2=Female
    civil_status VARCHAR(50), -- Single, Married, Widowed, Separated, Live-In
    
    -- Contact Information
    home_number VARCHAR(20), -- 8-digit landline number (e.g., 8000 0000)
    mobile_number VARCHAR(20), -- 11-digit mobile number (09xxxxxxxxx)
    email VARCHAR(256),
    
    -- Address Information
    address TEXT, -- Optional - some residents may not want to provide address
    purok INTEGER,
    street 
    
    -- Family Information
    family_group_id INTEGER REFERENCES family_groups(id) ON DELETE SET NULL, -- Links to family group
    family_role INTEGER CHECK (family_role IN (1, 2)), -- 1=parent, 2=child
    
    -- Personal Details
    religion VARCHAR(50)  DEFAULT 'Catholic',
    occupation VARCHAR(256),
    
    -- Special Category (single category per resident)
    special_category_id INTEGER REFERENCES special_categories(id) ON DELETE SET NULL, -- NULL = no special category
    notes TEXT, -- Additional details (e.g., type of PWD, specific conditions, etc.)
    
    -- System fields
    is_active INTEGER DEFAULT 1, -- 0=inactive, 1=active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_residents_user_id ON residents(user_id);
CREATE INDEX idx_residents_purok ON residents(purok);
CREATE INDEX idx_residents_family_group_id ON residents(family_group_id);
CREATE INDEX idx_residents_family_role ON residents(family_role);
CREATE INDEX idx_residents_last_name ON residents(last_name);
CREATE INDEX idx_residents_first_name ON residents(first_name);
CREATE INDEX idx_residents_gender ON residents(gender);
CREATE INDEX idx_residents_civil_status ON residents(civil_status);
CREATE INDEX idx_residents_special_category ON residents(special_category_id);
CREATE INDEX idx_residents_is_active ON residents(is_active);
CREATE INDEX idx_residents_full_name ON residents(first_name, last_name);

-- ============================================
-- FAMILY GROUPS TABLE
-- ============================================

-- Family Groups Table (groups residents into families)
DROP TABLE IF EXISTS family_groups CASCADE;

CREATE TABLE family_groups (
    id SERIAL PRIMARY KEY,
    family_name VARCHAR(100) NOT NULL, -- e.g., "Macariola Family", "Ong Family"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_family_groups_name ON family_groups(family_name);

-- Add foreign key constraint after family_groups table creation
ALTER TABLE residents ADD CONSTRAINT fk_residents_family_group 
    FOREIGN KEY (family_group_id) REFERENCES family_groups(id) ON DELETE SET NULL;

-- ============================================
-- SPECIAL CATEGORIES LOOKUP TABLES
-- ============================================

-- Special Categories Master Table (lookup table for all special categories)
DROP TABLE IF EXISTS special_categories CASCADE;

CREATE TABLE special_categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL, -- Unique identifier for the category
    category_name VARCHAR(100) NOT NULL, -- Display name
    description TEXT, -- Description of the category
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for special_categories
CREATE INDEX idx_special_categories_code ON special_categories(category_code);

-- ============================================
-- ADDITIONAL TABLES FOR EXTENDED FUNCTIONALITY
-- ============================================

-- Service Requests Table (for barangay services)
DROP TABLE IF EXISTS service_requests CASCADE;

CREATE TABLE service_requests (
    id SERIAL PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(id) ON DELETE CASCADE,
    request_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP DEFAULT NULL,
    notes TEXT
);

CREATE INDEX idx_service_requests_resident_id ON service_requests(resident_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_type ON service_requests(request_type);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at);

-- Announcements Table
DROP TABLE IF EXISTS announcements CASCADE;

CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type INTEGER DEFAULT 1, -- Announcement type: 1=General, 2=Health, 3=Activities, 4=Assistance, 5=Advisory
    is_active INTEGER DEFAULT 1, -- 0 = archived/deleted, 1 = active
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP DEFAULT NULL, -- NULL = draft, NOT NULL = published
);

-- Announcement Type Constants:
-- 1 = General (Regular announcements)
-- 2 = Health (Medical services, health programs)
-- 3 = Activities (Events, sports, workshops)
-- 4 = Assistance (Financial aid, PWD support, social services)
-- 5 = Advisory (Important notices, alerts, warnings)

-- Announcement Target Groups Table (for group-based publishing)
DROP TABLE IF EXISTS announcement_target_groups CASCADE;

CREATE TABLE announcement_target_groups (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL, -- 'all', 'role', 'purok', 'special_category', 'age_group', 'specific'
    target_value VARCHAR(100) DEFAULT NULL, -- role number, purok number, special_category code, age range, or specific user IDs (comma-separated)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Notifications Table (tracking SMS sent for announcements)
DROP TABLE IF EXISTS sms_notifications CASCADE;

CREATE TABLE sms_notifications (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(20) NOT NULL, -- Phone number (mobile_number or home_number)
    recipient_name VARCHAR(255) NOT NULL, -- Resident name for tracking
    resident_id INTEGER REFERENCES residents(id) ON DELETE SET NULL, -- NULL if resident deleted
    sms_content TEXT NOT NULL, -- Actual SMS message sent
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    provider_message_id VARCHAR(100) DEFAULT NULL, -- SMS provider's message ID for tracking
    error_message TEXT DEFAULT NULL, -- Error details if delivery failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcement_target_groups_announcement_id ON announcement_target_groups(announcement_id);
CREATE INDEX idx_announcement_target_groups_target_type ON announcement_target_groups(target_type);
CREATE INDEX idx_sms_notifications_announcement_id ON sms_notifications(announcement_id);
CREATE INDEX idx_sms_notifications_recipient_phone ON sms_notifications(recipient_phone);
CREATE INDEX idx_sms_notifications_resident_id ON sms_notifications(resident_id);
CREATE INDEX idx_sms_notifications_sent_at ON sms_notifications(sent_at);
CREATE INDEX idx_sms_notifications_delivery_status ON sms_notifications(delivery_status);

-- Audit Log Table (for tracking changes)
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);

-- ============================================
-- SAMPLE DATA INSERT (converted from MySQL)
-- ============================================

-- Insert sample users (authentication accounts)
INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$rBdKRUCkQbamzP5RMdXqIeT7N8yFZNGvGqOVH5K6uHHpC3qE9H0L2', 1), -- admin/admin123
('staff', '$2b$10$rBdKRUCkQbamzP5RMdXqIeT7N8yFZNGvGqOVH5K6uHHpC3qE9H0L2', 2), -- staff/staff123
('orlando.macariola', '$2b$10$rBdKRUCkQbamzP5RMdXqIeT7N8yFZNGvGqOVH5K6uHHpC3qE9H0L2', 3), -- resident account
('sarah.macariola', '$2b$10$rBdKRUCkQbamzP5RMdXqIeT7N8yFZNGvGqOVH5K6uHHpC3qE9H0L2', 3), -- resident account
('leoncio.ong', '$2b$10$rBdKRUCkQbamzP5RMdXqIeT7N8yFZNGvGqOVH5K6uHHpC3qE9H0L2', 3); -- resident account

-- Insert sample special categories (lookup data)
INSERT INTO special_categories (category_code, category_name, description) VALUES
('PWD', 'Person with Disability', 'Residents with physical, mental, intellectual, or sensory disabilities'),
('SOLO_PARENT', 'Solo Parent', 'Single parents raising children alone'),
('INDIGENT', 'Indigent', 'Residents classified as indigent for social services'),
('STUDENT', 'Student', 'Currently enrolled in educational institution'),

-- Insert sample family groups
INSERT INTO family_groups (family_name) VALUES
('Macariola Family'),
('Ong Family');

-- Insert sample residents (detailed resident information)
INSERT INTO residents (
    user_id, first_name, last_name, middle_name, birth_date, gender, civil_status,
    contact_number, email, address, purok, family_group_id, family_role, religion, occupation,
    special_category_id, notes
) VALUES
-- Macariola Family (family_group_id = 1)
-- Orlando Macariola Jr (Father) - linked to user account
(1, 'ORLANDO JR', 'MACARIOLA', 'PATONG', '1995-06-15', 1, 'Live in', 
 '09123456789', 'orlando.macariola@email.com', 'B1 L1 BURGOS ST', 1, 1, 1, 'Catholic', 'Professional',
 NULL, NULL),

-- Sarah Macariola (Mother) - linked to user account
(2, 'SARAH', 'MACARIOLA', 'LONELSITO', '1995-07-11', 2, 'Live in',
 '09123456789', 'sarah.macariola@email.com', 'B1 L1 BURGOS ST', 1, 1, 1, 'Iglesia ni Cristo', 'Employee',
 (SELECT id FROM special_categories WHERE category_code = 'PWD'), 'Visual impairment - partial sight'),

-- Sample child for Macariola family
(NULL, 'MIGUEL', 'MACARIOLA', 'LONELSITO', '2018-03-10', 1, 'Single',
 NULL, NULL, 'B1 L1 BURGOS ST', 1, 1, 2, 'Catholic', 'Student',
 NULL, 'Elementary student'),

-- Another child for Macariola family  
(NULL, 'MARIA', 'MACARIOLA', 'LONELSITO', '2020-08-15', 2, 'Single',
 NULL, NULL, 'B1 L1 BURGOS ST', 1, 1, 2, 'Catholic', 'Student',
 NULL, 'Preschool student'),

-- Ong Family (family_group_id = 2)
-- Leoncio Ong (Father) - linked to user account
(3, 'LEONCIO', 'ONG', 'TAN', '1942-12-05', 1, 'Married',
 '09447697875', 'leoncio.ong@email.com', 'B4 L1 BURGOS ST', 1, 2, 1, 'Islam', 'Pensioner',
 (SELECT id FROM special_categories WHERE category_code = 'SENIOR_CITIZEN'), 'War veteran with pension'),

-- Alicia Ong (Mother) - no user account
(NULL, 'ALICIA', 'ONG', 'MEDIOLA', '1956-03-14', 2, 'Married',
 '09447697875', NULL, 'B4 L1 BURGOS ST', 1, 2, 1, 'Others', 'Pensioner',
 (SELECT id FROM special_categories WHERE category_code = 'INDIGENT'), 'Qualified for social assistance programs');

-- Insert sample service requests
INSERT INTO service_requests (resident_id, request_type, description, status, priority) VALUES
(1, 'Barangay Certificate', 'Need certificate for employment requirement', 'pending', 'normal'),
(2, 'Barangay Clearance', 'For business permit application', 'completed', 'high'),
(5, 'Senior Citizen ID', 'Application for senior citizen benefits', 'processing', 'normal'),
(1, 'Certificate of Residency', 'For school enrollment of child', 'completed', 'normal'),
(2, 'Indigency Certificate', 'For medical assistance application', 'pending', 'urgent');

-- Insert sample announcements (some published, some drafts)
-- Type values: 1=General, 2=Health, 3=Activities, 4=Assistance, 5=Advisory
INSERT INTO announcements (title, content, type, created_by, published_by, published_at) VALUES
-- Published announcements
('Barangay Assembly Meeting', 'Monthly barangay assembly meeting scheduled for September 25, 2025 at 7:00 PM at the Barangay Hall.', 3, 1, 1, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('COVID-19 Vaccination', 'Free COVID-19 vaccination for residents aged 12 and above. Schedule: September 20-22, 2025.', 2, 1, 1, CURRENT_TIMESTAMP - INTERVAL '1 day'),
('Waste Collection Schedule', 'New waste collection schedule: Mondays and Thursdays for biodegradable, Tuesdays and Fridays for non-biodegradable.', 1, 1, 1, CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- Draft announcements (not published yet)
('Basketball Tournament 2025', 'Annual inter-purok basketball tournament registration is now open. Registration fee is ₱500 per team.', 3, 1, NULL, NULL),
('Health Program Announcement', 'Free medical check-up and consultation available every Wednesday from 9:00 AM to 3:00 PM.', 2, 1, NULL, NULL);

-- Insert sample announcement target groups
-- Sample SMS notifications (showing sent SMS for published announcements)
INSERT INTO sms_notifications (announcement_id, recipient_phone, recipient_name, resident_id, sms_content, delivery_status) VALUES
-- SMS sent for Barangay Assembly Meeting (all residents with mobile numbers)
(1, '09123456789', 'Juan Cruz', 1, 'BARANGAY LIAS: Monthly barangay assembly meeting scheduled for September 25, 2025 at 7:00 PM at the Barangay Hall. Your attendance is appreciated.', 'delivered'),
(1, '09447697875', 'Maria Santos', 2, 'BARANGAY LIAS: Monthly barangay assembly meeting scheduled for September 25, 2025 at 7:00 PM at the Barangay Hall. Your attendance is appreciated.', 'delivered'),

-- SMS sent for COVID-19 Vaccination (senior citizens and PWDs only)
(2, '09447697875', 'Leoncio Ong', 5, 'BARANGAY LIAS: Free COVID-19 vaccination for residents aged 12 and above. Schedule: September 20-22, 2025. Priority for senior citizens. Visit barangay hall.', 'delivered'),

-- SMS sent for Waste Collection (specific puroks)
(3, '09123456789', 'Juan Cruz', 1, 'BARANGAY LIAS: New waste collection schedule: Mondays and Thursdays for biodegradable, Tuesdays and Fridays for non-biodegradable. Purok 1-3 affected.', 'sent');
-- Barangay Assembly Meeting - for all residents
(1, 'all', NULL),
-- COVID-19 Vaccination - for senior citizens and PWDs (SMS to these groups)
(2, 'special_category', 'SENIOR_CITIZEN'),
(2, 'special_category', 'PWD'),
-- Waste Collection - for specific puroks
(3, 'purok', '1,2,3'),
-- Basketball Tournament - for adults (when published)
(4, 'age_group', '18-65'),
-- Health Program - for senior citizens (when published)
(5, 'special_category', 'SENIOR_CITIZEN');

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'Authentication and registration table - contains login credentials and basic account info';
COMMENT ON TABLE residents IS 'Comprehensive resident information and records - contains all detailed resident data';
COMMENT ON TABLE family_groups IS 'Family grouping table - groups residents into family units for tree display';
COMMENT ON TABLE special_categories IS 'Lookup table for special resident categories (government programs, roles, etc.)';
COMMENT ON TABLE service_requests IS 'Resident service requests and applications';
COMMENT ON TABLE announcements IS 'Stores barangay announcements with draft/publish workflow and soft delete via is_active';
COMMENT ON COLUMN announcements.is_active IS 'Archive/delete flag: 0 = archived/deleted, 1 = active';
COMMENT ON COLUMN announcements.published_at IS 'Publication timestamp: NULL = draft, NOT NULL = published';
COMMENT ON COLUMN announcements.published_by IS 'User who published the announcement: NULL = not published yet';
COMMENT ON COLUMN announcements.published_at IS 'NULL = draft/unpublished, timestamp = published and cannot be unpublished';
COMMENT ON TABLE announcement_target_groups IS 'Defines which user groups can see specific announcements and receive SMS notifications (all, role-based, purok-based, special categories, age groups, or specific users)';
COMMENT ON COLUMN announcement_target_groups.target_type IS 'Type of targeting: all, role, purok, special_category, age_group, specific';
COMMENT ON COLUMN announcement_target_groups.target_value IS 'Target value: role number, purok numbers, special category codes, age ranges (18-65), or specific user IDs';
COMMENT ON TABLE sms_notifications IS 'SMS notifications sent for announcements with delivery tracking and status monitoring';
COMMENT ON COLUMN sms_notifications.delivery_status IS 'SMS delivery status: pending, sent, delivered, failed';
COMMENT ON TABLE audit_logs IS 'System audit trail for data changes';

COMMENT ON COLUMN users.role IS '1=Admin, 2=Staff, 3=Resident (default for resident registration)';

COMMENT ON COLUMN residents.user_id IS 'One-to-one relationship with users table - NULL for residents without user accounts';
COMMENT ON COLUMN residents.family_group_id IS 'Groups residents into families - same ID means same family unit';
COMMENT ON COLUMN residents.family_role IS '1=parent, 2=child - application determines display label based on gender';
COMMENT ON COLUMN residents.gender IS '1=Male, 2=Female - used with family_role to determine display (Father/Mother, Son/Daughter)';
COMMENT ON COLUMN residents.religion IS 'Catholic, Islam, Iglesia ni Cristo, Others (constrained values)';
COMMENT ON COLUMN residents.special_category_id IS 'Single special category per resident (PWD, Senior Citizen, etc.) - NULL if no special category';
COMMENT ON COLUMN residents.notes IS 'Additional details about the resident (PWD type, specific conditions, etc.)';
COMMENT ON COLUMN residents.purok IS 'Purok number (1-7)';

COMMENT ON COLUMN service_requests.status IS 'pending/processing/completed/rejected';
COMMENT ON COLUMN service_requests.priority IS 'low/normal/high/urgent';

-- ============================================
-- GRANT PERMISSIONS (adjust as needed)
-- ============================================

-- Create application user (adjust credentials as needed)
-- CREATE USER smartlias_app WITH PASSWORD 'your_secure_password';

-- Grant necessary permissions
-- GRANT CONNECT ON DATABASE smartliasdb TO smartlias_app;
-- GRANT USAGE ON SCHEMA public TO smartlias_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartlias_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smartlias_app;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

-- Database setup completed successfully
-- Run: SELECT 'SmartLias PostgreSQL Database Setup Complete!' AS status;

