-- ============================================
-- DOCUMENT CATALOG TABLE - SmartLias
-- ============================================
-- Separate schema for document_catalog table
-- Run this if the table is missing from your database
-- Compatible with PostgreSQL 12+

-- Connect to database
\c smartliasdb;

-- Set timezone to Philippines (Manila)
SET timezone TO 'Asia/Manila';

-- ============================================
-- DROP EXISTING TABLE
-- ============================================
DROP TABLE IF EXISTS document_catalog CASCADE;

-- ============================================
-- CREATE DOCUMENT CATALOG TABLE
-- ============================================
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

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX idx_document_catalog_active ON document_catalog(is_active);
CREATE INDEX idx_document_catalog_title ON document_catalog(title);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================
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

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE document_catalog IS 'Master catalog of available document types with fees and requirements';
COMMENT ON COLUMN document_catalog.title IS 'Document name: Electrical Permit, Fence Permit, Excavation Permit, Barangay Clearance, Certificate of Residency, Certificate of Good Moral, Certificate of Indigency (Medical), Certificate of Indigency (Financial), Business Permit Clearance';
COMMENT ON COLUMN document_catalog.description IS 'Detailed description of the document and its requirements';
COMMENT ON COLUMN document_catalog.filename IS 'Template filename for document generation';
COMMENT ON COLUMN document_catalog.fee IS 'Processing fee in PHP - 0.00 for indigency certificates, varies for other documents';
COMMENT ON COLUMN document_catalog.is_active IS '1=available for request, 0=temporarily unavailable';

-- ============================================
-- VERIFY TABLE CREATION
-- ============================================
-- Check if table exists
SELECT 
    'document_catalog table created successfully!' AS status,
    COUNT(*) AS total_documents,
    COUNT(*) FILTER (WHERE is_active = 1) AS active_documents,
    COUNT(*) FILTER (WHERE fee = 0) AS free_documents
FROM document_catalog;

-- Display all documents
SELECT 
    id,
    title,
    fee,
    CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status
FROM document_catalog
ORDER BY id;

-- ============================================
-- COMPLETION
-- ============================================
SELECT 'Document Catalog setup complete!' AS message;
