-- ============================================
-- 000-CREATE USERS AND DATABASE
-- ============================================
-- Purpose: Initial database and user setup
-- Run first: Creates database, users, and basic permissions
-- Required privileges: Superuser (postgres)

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
-- USER CREATION AND PRIVILEGES
-- ============================================

-- Create application user for SmartLias
-- NOTE: Change 'admin123' to a secure password before running in production
CREATE USER smartlias_app_su WITH
    CREATEDB
    CREATEROLE
    LOGIN
    REPLICATION
    CONNECTION LIMIT -1
    PASSWORD 'admin123';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE smartliasdb TO smartlias_app_su;

-- Make smartlias_app_su the owner of the database for full control
ALTER DATABASE smartliasdb OWNER TO smartlias_app_su;

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

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'SmartLias Database and User Setup Complete!' AS status;
SELECT 'Next: Run 001-core-tables.sql' AS next_step;
