-- SmartLias PostgreSQL Database Schema
-- Converted from MySQL/MariaDB to PostgreSQL
-- Generation Date: September 18, 2025
-- Compatible with PostgreSQL 12+

-- Drop existing database if exists (optionATABASE IF EXISTS smartliasdb;

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
    street VARCHAR(20), -- STREET_ID
    
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
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL=system_generated (registration), user_id=admin created
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
CREATE INDEX idx_residents_created_by ON residents(created_by);
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

-- Document Catalog Table (master/lookup table for available documents)
DROP TABLE IF EXISTS document_catalog CASCADE;

CREATE TABLE document_catalog (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL, -- "Barangay Certificate", "Certificate of Indigency", etc.
    description TEXT, -- Detailed description of the document and requirements
    filename VARCHAR(255), -- Template filename if any (e.g., "barangay_certificate_template.pdf")
    fee DECIMAL(10,2) DEFAULT 0.00, -- Document processing fee in PHP
    is_active INTEGER DEFAULT 1, -- 0=inactive, 1=active (for enabling/disabling document types)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_catalog_active ON document_catalog(is_active);
CREATE INDEX idx_document_catalog_title ON document_catalog(title);

-- Document Requests Table (for barangay document applications)
DROP TABLE IF EXISTS document_requests CASCADE;

CREATE TABLE document_requests (
    id SERIAL PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES document_catalog(id) ON DELETE RESTRICT, -- Reference to document catalog
    purpose TEXT, -- Purpose of the document request
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, ready, completed, rejected
    priority VARCHAR(20) DEFAULT NULL, -- NULL initially, admin sets: low, normal, high, urgent
    priority_set_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Admin/staff who set the priority
    priority_set_at TIMESTAMP DEFAULT NULL, -- When priority was set
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP DEFAULT NULL,
    notes TEXT, -- Internal notes from staff/admin
    attachment_path VARCHAR(500) DEFAULT NULL -- File path for supporting documents
);

CREATE INDEX idx_document_requests_resident_id ON document_requests(resident_id);
CREATE INDEX idx_document_requests_status ON document_requests(status);
CREATE INDEX idx_document_requests_document_id ON document_requests(document_id);
CREATE INDEX idx_document_requests_created_at ON document_requests(created_at);
CREATE INDEX idx_document_requests_priority ON document_requests(priority);
CREATE INDEX idx_document_requests_priority_set_by ON document_requests(priority_set_by);

-- Announcements Table
DROP TABLE IF EXISTS announcements CASCADE;

CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type INTEGER DEFAULT 1, -- Announcement type: 1=General, 2=Health, 3=Activities, 4=Assistance, 5=Advisory
    target_type VARCHAR(20) DEFAULT NULL, -- NULL = SMS OFF, 'all' = SMS to all, 'special_category' = specific group
    target_value VARCHAR(100) DEFAULT NULL -- target value (e.g., 'PWD' for special_category, '18-65' for age_group)
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP DEFAULT NULL, -- NULL = unpublished, NOT NULL = published
);

-- Announcement Type Constants:
-- 1 = General (Regular announcements)
-- 2 = Health (Medical services, health programs)
-- 3 = Activities (Events, sports, workshops)
-- 4 = Assistance (Financial aid, PWD support, social services)
-- 5 = Advisory (Important notices, alerts, warnings)

-- SMS Logging Table (simplified - tracks at announcement level, not per-recipient)
DROP TABLE IF EXISTS announcement_sms_logs CASCADE;

CREATE TABLE announcement_sms_logs (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
    target_groups JSONB NOT NULL, -- Store which groups SMS was sent to: ["all"] or ["special_category:PWD", "age_group:18-65"]
    total_recipients INTEGER NOT NULL, -- How many people received SMS
    successful_sends INTEGER DEFAULT 0, -- How many were successful
    failed_sends INTEGER DEFAULT 0, -- How many failed
    sms_content TEXT NOT NULL, -- The actual message sent
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    provider_response JSONB DEFAULT NULL, -- Batch response from SMS provider (Semaphore API response)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcements_target ON announcements(target_type, target_value);
CREATE INDEX idx_announcement_sms_logs_announcement_id ON announcement_sms_logs(announcement_id);
CREATE INDEX idx_announcement_sms_logs_sent_at ON announcement_sms_logs(sent_at);

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
    mobile_number, email, address, purok, family_group_id, family_role, religion, occupation,
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
 NULL, 'War veteran with pension - Senior citizen (age calculated dynamically)'),

-- Alicia Ong (Mother) - no user account
(NULL, 'ALICIA', 'ONG', 'MEDIOLA', '1956-03-14', 2, 'Married',
 '09447697875', NULL, 'B4 L1 BURGOS ST', 1, 2, 1, 'Others', 'Pensioner',
 (SELECT id FROM special_categories WHERE category_code = 'INDIGENT'), 'Qualified for social assistance programs');

-- Insert sample document catalog (available document types)
INSERT INTO document_catalog (title, description, filename, fee, is_active) VALUES
('Electrical Permit', 'Permit required for electrical installations and repairs in residential or commercial properties.', 'electrical_permit_template.pdf', 100.00, 1),
('Fence Permit', 'Authorization to construct fences around residential or commercial properties within barangay jurisdiction.', 'fence_permit_template.pdf', 75.00, 1),
('Excavation Permit', 'Permit for excavation activities including digging, construction foundations, and land development.', 'excavation_permit_template.pdf', 150.00, 1),
('Barangay Clearance', 'Certificate indicating no pending cases or issues in the barangay. Required for employment and various transactions.', 'barangay_clearance_template.pdf', 50.00, 1),
('Certificate of Residency', 'Official certificate proving residency within the barangay. Required for school enrollment and government transactions.', 'certificate_of_residency_template.pdf', 40.00, 1),
('Certificate of Good Moral', 'Character reference certificate from barangay officials attesting to good moral standing in the community.', 'good_moral_template.pdf', 30.00, 1),
('Certificate of Indigency (Medical)', 'Document certifying indigent status specifically for medical assistance and healthcare support programs.', 'indigency_medical_template.pdf', 0.00, 1),
('Certificate of Indigency (Financial)', 'Document certifying indigent status for financial assistance and social services programs.', 'indigency_financial_template.pdf', 0.00, 1),
('Business Permit Clearance', 'Barangay clearance required for small business operations and business permit applications.', 'business_permit_template.pdf', 100.00, 1);

-- Insert sample document requests
INSERT INTO document_requests (resident_id, document_id, purpose, status, priority, priority_set_by, priority_set_at) VALUES
-- New requests without priority (as submitted by residents)
(1, 1, 'Home electrical wiring installation', 'pending', NULL, NULL, NULL),
(3, 2, 'Property boundary fence construction', 'pending', NULL, NULL, NULL),
(1, 6, 'Character reference for job application', 'pending', NULL, NULL, NULL),
(5, 9, 'Small sari-sari store business permit', 'pending', NULL, NULL, NULL),

-- Requests with admin-assigned priorities (processed by staff)
(2, 4, 'Employment requirement at ABC Company', 'ready', 'high', 1, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 5, 'School enrollment of child', 'completed', 'normal', 1, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(2, 7, 'Medical assistance application for surgery', 'processing', 'urgent', 1, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(3, 4, 'Travel abroad document requirements', 'processing', 'normal', 1, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 8, 'Financial assistance for family emergency', 'completed', 'high', 1, CURRENT_TIMESTAMP - INTERVAL '4 days');

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

-- Sample data now uses direct target columns in announcements table

-- Sample SMS logs (showing sent SMS for published announcements - simplified)
INSERT INTO announcement_sms_logs (announcement_id, target_groups, total_recipients, successful_sends, failed_sends, sms_content) VALUES
-- SMS sent for Barangay Assembly Meeting (all residents with mobile numbers)
(1, '["all"]', 45, 43, 2, 'BARANGAY LIAS: Monthly barangay assembly meeting scheduled for September 25, 2025 at 7:00 PM at the Barangay Hall. Your attendance is appreciated.'),

-- SMS sent for COVID-19 Vaccination (senior citizens and PWDs only)
(2, '["age_group:60+", "special_category:PWD"]', 18, 16, 2, 'BARANGAY LIAS: Free COVID-19 vaccination for residents aged 12 and above. Schedule: September 20-22, 2025. Priority for senior citizens and PWDs.'),

-- SMS sent for Waste Collection (all residents)
(3, '["all"]', 45, 45, 0, 'BARANGAY LIAS: New waste collection schedule: Mondays and Thursdays for biodegradable, Tuesdays and Fridays for non-biodegradable.');

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'Authentication and registration table - contains login credentials and basic account info';
COMMENT ON TABLE residents IS 'Comprehensive resident information and records - contains all detailed resident data';
COMMENT ON TABLE family_groups IS 'Family grouping table - groups residents into family units for tree display';
COMMENT ON TABLE special_categories IS 'Lookup table for special resident categories (government programs, roles, etc.)';
COMMENT ON TABLE document_catalog IS 'Master catalog of available document types with fees and requirements';
COMMENT ON TABLE document_requests IS 'Resident document requests and applications for barangay certificates and clearances';
COMMENT ON TABLE announcements IS 'Stores barangay announcements with draft/publish workflow. Status managed by published_at: NULL = unpublished, NOT NULL = published';
COMMENT ON COLUMN announcements.published_at IS 'Publication timestamp: NULL = draft, NOT NULL = published';
COMMENT ON COLUMN announcements.published_by IS 'User who published the announcement: NULL = not published yet';
COMMENT ON COLUMN announcements.published_at IS 'NULL = draft/unpublished, timestamp = published and cannot be unpublished';
COMMENT ON COLUMN announcements.target_type IS 'SMS indicator: NULL = SMS OFF, "all" = SMS to all residents, "special_category" = specific group, etc.';
COMMENT ON COLUMN announcements.target_value IS 'SMS target value (e.g., "PWD" for special_category, "18-65" for age_group, NULL for "all")';
COMMENT ON TABLE announcement_sms_logs IS 'SMS logs for announcements - tracks summary statistics per announcement instead of individual SMS records';
COMMENT ON COLUMN announcement_sms_logs.target_groups IS 'JSON array of target groups that received SMS: ["all"] or ["special_category:PWD", "age_group:18-65"]';
COMMENT ON COLUMN announcement_sms_logs.total_recipients IS 'Total number of residents who received SMS (regardless of success/failure)';
COMMENT ON COLUMN announcement_sms_logs.successful_sends IS 'Number of SMS successfully sent';
COMMENT ON COLUMN announcement_sms_logs.failed_sends IS 'Number of SMS that failed to send';
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

COMMENT ON COLUMN document_catalog.title IS 'Document name: Electrical Permit, Fence Permit, Excavation Permit, Barangay Clearance, Certificate of Residency, Certificate of Good Moral, Certificate of Indigency (Medical), Certificate of Indigency (Financial), Business Permit Clearance';
COMMENT ON COLUMN document_catalog.fee IS 'Processing fee in PHP - 0.00 for indigency certificates, varies for other documents';
COMMENT ON COLUMN document_catalog.is_active IS '1=available for request, 0=temporarily unavailable';
COMMENT ON COLUMN document_requests.status IS 'pending/processing/ready/completed/rejected - ready means document is prepared and ready for pickup';
COMMENT ON COLUMN document_requests.priority IS 'NULL initially (resident submits without priority), admin sets: low/normal/high/urgent - affects processing order';
COMMENT ON COLUMN document_requests.priority_set_by IS 'Admin/staff user who assigned the priority level';
COMMENT ON COLUMN document_requests.priority_set_at IS 'Timestamp when priority was assigned by admin/staff';
COMMENT ON COLUMN document_requests.purpose IS 'Reason or purpose for requesting the document';
COMMENT ON COLUMN document_requests.attachment_path IS 'File path to supporting documents uploaded by resident';

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

