-- ============================================
-- 004-CHATBOT SCHEMA
-- ============================================
-- Purpose: AI Chatbot FAQ system and conversation management
-- Dependencies: 001-core-tables.sql
-- Tables: faq_categories, faqs, conversations, chat_messages

-- Connect to database
\c smartliasdb;

-- ============================================
-- CHATBOT TABLES
-- ============================================

-- Drop existing tables
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS faq_categories CASCADE;

-- FAQ Categories Table
CREATE TABLE faq_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- Icon name for UI (e.g., 'document', 'info', 'help')
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ Table
CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES faq_categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- Keywords for matching (comma-separated or JSON array)
    keywords TEXT, -- e.g., "document, request, barangay clearance, requirements"
    
    -- Metadata
    view_count INTEGER DEFAULT 0, -- Track popularity
    helpful_count INTEGER DEFAULT 0, -- User feedback: helpful
    not_helpful_count INTEGER DEFAULT 0, -- User feedback: not helpful
    
    -- Status and management
    is_active INTEGER DEFAULT 1, -- 0=disabled, 1=active
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations Table (Chat Sessions)
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous users
    session_id VARCHAR(255) NOT NULL UNIQUE, -- Frontend-generated session identifier
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP DEFAULT NULL, -- NULL = active conversation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table (Individual Messages)
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(10) NOT NULL CHECK (message_type IN ('user', 'bot')),
    message_text TEXT NOT NULL,
    
    -- Bot response metadata
    faq_id INTEGER REFERENCES faqs(id) ON DELETE SET NULL, -- NULL if not from FAQ
    source VARCHAR(50), -- 'database', 'ai-gemini', 'ai-openai', 'fallback', etc.
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00 confidence in response
    
    -- User feedback
    was_helpful INTEGER DEFAULT NULL, -- NULL=no feedback, 1=helpful, 0=not helpful
    feedback_text TEXT, -- Optional feedback from user
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- FAQ Categories indexes
CREATE INDEX idx_faq_categories_active ON faq_categories(is_active);
CREATE INDEX idx_faq_categories_display_order ON faq_categories(display_order);

-- FAQs indexes
CREATE INDEX idx_faqs_category_id ON faqs(category_id);
CREATE INDEX idx_faqs_active ON faqs(is_active);
CREATE INDEX idx_faqs_view_count ON faqs(view_count);
CREATE INDEX idx_faqs_helpful_count ON faqs(helpful_count);
CREATE INDEX idx_faqs_created_by ON faqs(created_by);

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);
CREATE INDEX idx_conversations_ended_at ON conversations(ended_at);

-- Chat Messages indexes
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_message_type ON chat_messages(message_type);
CREATE INDEX idx_chat_messages_faq_id ON chat_messages(faq_id);
CREATE INDEX idx_chat_messages_source ON chat_messages(source);
CREATE INDEX idx_chat_messages_was_helpful ON chat_messages(was_helpful);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE faq_categories IS 'Categories for organizing FAQ items (Documents, Services, Contact Info, etc.)';
COMMENT ON TABLE faqs IS 'Frequently Asked Questions with answers and keyword matching for chatbot';
COMMENT ON TABLE conversations IS 'Chat conversation sessions - groups related messages together';
COMMENT ON TABLE chat_messages IS 'Individual chat messages from users and bot responses with metadata';

-- ============================================
-- COLUMN COMMENTS
-- ============================================

-- FAQ Categories Table Comments
COMMENT ON COLUMN faq_categories.id IS 'Primary key - unique identifier for FAQ categories';
COMMENT ON COLUMN faq_categories.category_name IS 'Category display name: Documents, Services, Contact Info, etc.';
COMMENT ON COLUMN faq_categories.description IS 'Detailed description of what this category covers';
COMMENT ON COLUMN faq_categories.icon IS 'UI icon name for visual representation';
COMMENT ON COLUMN faq_categories.display_order IS 'Sort order for category display (lower numbers first)';
COMMENT ON COLUMN faq_categories.is_active IS '1=visible to users, 0=hidden from public';
COMMENT ON COLUMN faq_categories.created_at IS 'Category creation timestamp';
COMMENT ON COLUMN faq_categories.updated_at IS 'Last modification timestamp';

-- FAQs Table Comments
COMMENT ON COLUMN faqs.id IS 'Primary key - unique identifier for FAQ items';
COMMENT ON COLUMN faqs.category_id IS 'Links to faq_categories table for organization';
COMMENT ON COLUMN faqs.question IS 'The frequently asked question text';
COMMENT ON COLUMN faqs.answer IS 'The answer to the question - can include basic markdown';
COMMENT ON COLUMN faqs.keywords IS 'Comma-separated keywords for search matching';
COMMENT ON COLUMN faqs.view_count IS 'Number of times this FAQ was viewed/matched';
COMMENT ON COLUMN faqs.helpful_count IS 'Number of positive feedback responses';
COMMENT ON COLUMN faqs.not_helpful_count IS 'Number of negative feedback responses';
COMMENT ON COLUMN faqs.is_active IS '1=available for matching, 0=disabled';
COMMENT ON COLUMN faqs.created_by IS 'User who created this FAQ entry';
COMMENT ON COLUMN faqs.created_at IS 'FAQ creation timestamp';
COMMENT ON COLUMN faqs.updated_at IS 'Last modification timestamp';

-- Conversations Table Comments
COMMENT ON COLUMN conversations.id IS 'Primary key - unique identifier for chat conversations';
COMMENT ON COLUMN conversations.user_id IS 'Links to users table - NULL for anonymous/guest users';
COMMENT ON COLUMN conversations.session_id IS 'Frontend-generated session identifier for tracking';
COMMENT ON COLUMN conversations.started_at IS 'When the conversation began';
COMMENT ON COLUMN conversations.ended_at IS 'When conversation ended - NULL for active sessions';
COMMENT ON COLUMN conversations.created_at IS 'Conversation record creation timestamp';
COMMENT ON COLUMN conversations.updated_at IS 'Last modification timestamp';

-- Chat Messages Table Comments
COMMENT ON COLUMN chat_messages.id IS 'Primary key - unique identifier for chat messages';
COMMENT ON COLUMN chat_messages.conversation_id IS 'Links to conversations table - groups messages together';
COMMENT ON COLUMN chat_messages.message_type IS 'Type of message: user (from resident) or bot (from AI)';
COMMENT ON COLUMN chat_messages.message_text IS 'The actual message content/text';
COMMENT ON COLUMN chat_messages.faq_id IS 'Links to faqs table if response came from FAQ - NULL for AI/fallback';
COMMENT ON COLUMN chat_messages.source IS 'Response source: database, ai-gemini, ai-openai, fallback, etc.';
COMMENT ON COLUMN chat_messages.confidence_score IS 'AI confidence in response (0.00-1.00) - NULL for FAQ responses';
COMMENT ON COLUMN chat_messages.was_helpful IS 'User feedback: NULL=no feedback, 1=helpful, 0=not helpful';
COMMENT ON COLUMN chat_messages.feedback_text IS 'Optional detailed feedback from user';
COMMENT ON COLUMN chat_messages.created_at IS 'Message timestamp';

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert FAQ Categories
INSERT INTO faq_categories (category_name, description, icon, display_order, is_active) VALUES
('Documents', 'Document requests, requirements, and fees', 'document', 1, 1),
('Services', 'Barangay services and assistance programs', 'service', 2, 1),
('Contact Info', 'Office hours, contact details, and location', 'contact', 3, 1),
('Programs', 'Government programs and assistance', 'program', 4, 1),
('General Info', 'General barangay information and procedures', 'info', 5, 1);

-- Insert Sample FAQs
INSERT INTO faqs (category_id, question, answer, keywords, is_active, created_by) VALUES
-- Documents Category
((SELECT id FROM faq_categories WHERE category_name = 'Documents'), 
 'What documents can I request from the barangay?', 
 'You can request the following documents from our barangay:\n\n{{DOCUMENT_CATALOG_LIST}}\n\nFor more details about requirements and fees, please visit our office or contact us.',
 'documents, request, available, barangay, clearance, certificate, permit',
 1, 1),

((SELECT id FROM faq_categories WHERE category_name = 'Documents'), 
 'What are the document fees?', 
 'Here are the current document processing fees:\n\n{{DOCUMENT_FEES_LIST}}\n\nFees may be waived for qualified indigent residents. Please bring valid ID and proof of indigency.',
 'fees, cost, price, bayad, magkano, document',
 1, 1),

((SELECT id FROM faq_categories WHERE category_name = 'Documents'), 
 'What are the requirements for barangay clearance?', 
 'For Barangay Clearance, please bring:\n• Valid government ID\n• Cedula (Community Tax Certificate)\n• Proof of residency\n• Processing fee: ₱50.00\n\nProcessing time: 1-2 working days',
 'barangay clearance, requirements, ID, cedula, residency',
 1, 1),

-- Services Category
((SELECT id FROM faq_categories WHERE category_name = 'Services'), 
 'What services does the barangay offer?', 
 'Our barangay offers the following services:\n• Document processing and certification\n• Blotter and incident reporting\n• Mediation and dispute resolution\n• Health and wellness programs\n• Senior citizen and PWD assistance\n• Business permit facilitation\n• Emergency response coordination',
 'services, offer, available, assistance, help',
 1, 1),

-- Contact Info Category
((SELECT id FROM faq_categories WHERE category_name = 'Contact Info'), 
 'What are the barangay office hours?', 
 'Barangay Office Hours:\n• Monday to Friday: 8:00 AM - 5:00 PM\n• Saturday: 8:00 AM - 12:00 PM\n• Sunday: Closed\n• Holidays: Closed\n\nFor emergencies, contact our 24/7 hotline.',
 'office hours, schedule, open, closed, time',
 1, 1),

((SELECT id FROM faq_categories WHERE category_name = 'Contact Info'), 
 'How can I contact the barangay?', 
 'You can contact us through:\n• Visit: Barangay Office, [Address]\n• Phone: [Phone Number]\n• Mobile: [Mobile Number]\n• Email: [Email Address]\n• Facebook: [Facebook Page]\n• Through SmartLIAS system',
 'contact, phone, email, address, reach, communicate',
 1, 1),

-- Programs Category
((SELECT id FROM faq_categories WHERE category_name = 'Programs'), 
 'What assistance programs are available?', 
 'Available assistance programs:\n• Senior Citizen Cash Assistance\n• PWD Support Services\n• Indigent Medical Assistance\n• Educational Assistance\n• Livelihood Programs\n• Emergency Financial Aid\n\nVisit our office for eligibility requirements.',
 'assistance, programs, help, support, aid, senior, PWD, medical',
 1, 1),

-- General Info Category
((SELECT id FROM faq_categories WHERE category_name = 'General Info'), 
 'How do I register as a new resident?', 
 'To register as a new resident:\n1. Visit the Barangay Office\n2. Fill out the resident registration form\n3. Provide valid ID and proof of address\n4. Submit supporting documents\n5. Wait for verification (1-3 days)\n6. Receive your resident certificate\n\nNo fees for basic registration.',
 'register, registration, new resident, move in, resident',
 1, 1);

-- Reset sequences
SELECT setval('faq_categories_id_seq', (SELECT MAX(id) FROM faq_categories));
SELECT setval('faqs_id_seq', (SELECT MAX(id) FROM faqs));
SELECT setval('conversations_id_seq', 1);
SELECT setval('chat_messages_id_seq', 1);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Chatbot Schema Complete!' AS status;
SELECT 'Next: Run 005-enable-similarity.sql (optional)' AS next_step;
