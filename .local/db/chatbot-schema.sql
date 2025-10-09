-- ============================================
-- CHATBOT FAQ SYSTEM - Database Schema
-- ============================================
-- Purpose: Store FAQs and chat conversations for SmartLias chatbot
-- Features: FAQ management, keyword matching, conversation history, AI learning

-- Connect to database
\c smartliasdb;

-- Enable required extensions for advanced text search and similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================
-- FAQ CATEGORIES TABLE
-- ============================================
DROP TABLE IF EXISTS faq_categories CASCADE;

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

CREATE INDEX idx_faq_categories_active ON faq_categories(is_active);
CREATE INDEX idx_faq_categories_display_order ON faq_categories(display_order);

-- ============================================
-- FAQ TABLE
-- ============================================
DROP TABLE IF EXISTS faqs CASCADE;

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
    
    -- System fields
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faqs_category_id ON faqs(category_id);
CREATE INDEX idx_faqs_active ON faqs(is_active);
CREATE INDEX idx_faqs_keywords ON faqs USING gin(to_tsvector('english', keywords));
CREATE INDEX idx_faqs_question ON faqs USING gin(to_tsvector('english', question));

-- ============================================
-- CHAT CONVERSATIONS TABLE
-- ============================================
DROP TABLE IF EXISTS chat_conversations CASCADE;

CREATE TABLE chat_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous users
    session_id VARCHAR(100) NOT NULL, -- Unique session identifier
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP DEFAULT NULL,
    is_active INTEGER DEFAULT 1
);

CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_session_id ON chat_conversations(session_id);
CREATE INDEX idx_chat_conversations_active ON chat_conversations(is_active);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
DROP TABLE IF EXISTS chat_messages CASCADE;

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE,
    
    -- Message content
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'bot', 'system')),
    message_text TEXT NOT NULL,
    
    -- FAQ reference (if bot response was from FAQ)
    faq_id INTEGER REFERENCES faqs(id) ON DELETE SET NULL,
    
    -- Feedback
    was_helpful INTEGER DEFAULT NULL, -- NULL=no feedback, 1=helpful, 0=not helpful
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_type ON chat_messages(message_type);
CREATE INDEX idx_chat_messages_faq_id ON chat_messages(faq_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_helpful ON chat_messages(was_helpful) WHERE was_helpful IS NOT NULL;
CREATE INDEX idx_chat_messages_text_search ON chat_messages USING gin(to_tsvector('english', message_text));
CREATE INDEX idx_chat_messages_similarity ON chat_messages USING gist(message_text gist_trgm_ops);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert FAQ Categories
INSERT INTO faq_categories (category_name, description, icon, display_order) VALUES
('Documents', 'Questions about document requests and requirements', 'document', 1),
('Barangay Services', 'General information about barangay services', 'service', 2),
('Registration', 'Account registration and profile management', 'user', 3),
('Announcements', 'Information about barangay announcements and updates', 'megaphone', 4),
('Contact', 'How to reach barangay officials and offices', 'phone', 5),
('General', 'General questions and other inquiries', 'help', 6);

-- Insert Sample FAQs

-- Documents Category FAQs
INSERT INTO faqs (category_id, question, answer, keywords, display_order) VALUES
(1, 'What documents can I request from the barangay?', 
 'You can request the following documents from Barangay Lias:

**Available Documents & Current Fees:**
{{DOCUMENT_CATALOG_LIST}}

**How to Request:**
1. Log in to your SmartLias account
2. Go to the "Documents" section
3. Select your document type
4. Current fees will be displayed
5. Fill in purpose and upload supporting documents
6. Submit your request

**Note:** Fees are subject to change. Current fees shown above are updated in real-time from our system.', 
 'document, request, available, barangay clearance, certificate, permit, requirements, what documents, fee, fees, cost, price, catalog, list', 
 1),

(1, 'How do I request a barangay clearance?',
 'To request a Barangay Clearance:

**Current Fee:** {{BARANGAY_CLEARANCE_FEE}}

**Steps:**
1. **Log in** to your SmartLias account
2. Go to **"Documents"** section
3. Click **"Request Document"**
4. Select **"Barangay Clearance"** from the list
5. **Fee will be displayed** (currently {{BARANGAY_CLEARANCE_FEE}})
6. Fill in the **purpose** of your request
7. Upload any **supporting documents** (if required)
8. Click **Submit**

**Processing Time:** Usually 1-3 business days
**Payment:** Pay the fee upon document pickup at the Barangay Office

You will be notified when your document is ready for pickup.',
 'barangay clearance, request, how to request, application, apply, requirements, process, steps, fee, cost, price',
 2),

(1, 'How long does it take to process document requests?',
 'Document processing times vary:

• **Regular requests:** 1-3 business days
• **Urgent requests:** Same day to next day (if approved by admin)
• **Indigency certificates:** Usually processed within 1-2 days

You will receive a notification when your document status changes. You can also check the status anytime in your account under the "Requests" or "Documents" section.

**Note:** Processing time may be longer during peak periods or holidays.',
 'processing time, how long, duration, wait, when ready, how many days',
 3),

(1, 'What are the requirements for Certificate of Indigency?',
 'For **Certificate of Indigency** (Medical or Financial):

**Current Fee:** {{INDIGENCY_CERTIFICATE_FEE}} (FREE for eligible residents)

**Requirements:**
• Valid ID
• Proof of residency in Barangay Lias
• Supporting documents depending on purpose:
  - **Medical:** Medical certificate, hospital bills, or prescription
  - **Financial:** Proof of financial need

**How to apply:**
1. Log in to your account
2. Go to Documents section
3. Select "Certificate of Indigency (Medical)" or "Certificate of Indigency (Financial)"
4. Provide the purpose and attach supporting documents
5. Submit request

The barangay will verify your eligibility before approval.',
 'indigency, certificate of indigency, medical, financial, requirements, free, assistance, poor, low income, fee, cost',
 4),

(1, 'How much are the fees for barangay documents?',
 'Here are the current fees for barangay documents:

{{DOCUMENT_FEES_LIST}}

**Payment Methods:**
• Cash payment upon document pickup
• Payment at the Barangay Office

**Note:** 
• Fees are subject to change based on local ordinances
• Free documents are available for qualified indigent residents
• Current fees shown above are updated in real-time',
 'fees, cost, price, how much, payment, document fees, barangay fees, charges',
 5),

(1, 'What permits can I get from the barangay?',
 'Barangay Lias issues the following permits:

{{PERMIT_CATALOG_LIST}}

**General Requirements:**
• Valid ID
• Proof of residency
• Specific requirements per permit type
• Payment of applicable fees

**Processing Time:** 1-5 business days depending on permit type

For detailed requirements and current fees, please select the specific permit when making your request online.',
 'permits, permit, electrical permit, fence permit, excavation permit, business permit, construction, building',
 6);

-- Barangay Services Category FAQs
INSERT INTO faqs (category_id, question, answer, keywords, display_order) VALUES
(2, 'What are the office hours of Barangay Lias?',
 '**Barangay Lias Office Hours:**

📅 **Monday to Friday:** 8:00 AM - 5:00 PM
📅 **Saturday:** 8:00 AM - 12:00 PM
📅 **Sunday & Holidays:** Closed

**Lunch Break:** 12:00 PM - 1:00 PM

For urgent matters outside office hours, please contact the emergency hotline or reach out to barangay officials.',
 'office hours, schedule, open, time, when open, operating hours, business hours',
 1),

(2, 'How can I contact barangay officials?',
 'You can contact Barangay Lias officials through:

📞 **Barangay Office Landline:** (046) XXX-XXXX
📱 **Mobile/SMS:** 0947-XXX-XXXX
📧 **Email:** barangaylias@example.com
📍 **Visit:** Barangay Office, Barangay Lias, Imus, Cavite

**Office Hours:**
• Monday-Friday: 8:00 AM - 5:00 PM
• Saturday: 8:00 AM - 12:00 PM

For emergencies, please contact the emergency hotline: **911**',
 'contact, phone number, email, address, location, reach, call, message, barangay officials',
 2),

(2, 'What services does the barangay provide?',
 'Barangay Lias provides the following services:

📄 **Document Services**
• Barangay Clearance
• Certificates (Residency, Good Moral, Indigency)
• Permits (Business, Electrical, Fence, Excavation)

🏥 **Health Services**
• Free medical check-ups (Wednesdays)
• Vaccination programs
• Health education

🤝 **Assistance Programs**
• Financial assistance for indigent families
• Medical assistance
• PWD and senior citizen programs

📢 **Information Services**
• Announcements and advisories
• Event notifications via SMS

🔒 **Peace and Order**
• Barangay tanod services
• Mediation and dispute resolution',
 'services, what services, programs, assistance, help, available, offer, provide',
 3);

-- Registration Category FAQs
INSERT INTO faqs (category_id, question, answer, keywords, display_order) VALUES
(3, 'How do I register for a SmartLias account?',
 'To register for a SmartLias account:

1. Go to the **Registration page**
2. Fill in your personal information:
   • Username (6-32 characters, lowercase, numbers, underscore)
   • Personal details (Name, birthdate, gender, etc.)
   • Contact information (mobile number, email)
   • Address information
3. Create your **6-digit PIN**
4. Submit your registration

**Important:**
• Your registration will be reviewed by barangay staff
• You will receive a notification once approved
• Keep your PIN secure and don''t share it with anyone

**Requirements:**
• Must be a resident of Barangay Lias
• Valid mobile number for SMS notifications',
 'register, registration, sign up, create account, new account, how to register, join',
 1),

(3, 'I forgot my PIN. How can I reset it?',
 'If you forgot your PIN:

**Option 1: Contact Barangay Office**
• Visit the Barangay Office in person
• Bring a valid ID
• Staff will verify your identity and reset your PIN
• You will receive temporary credentials

**Option 2: Contact Admin via Phone**
• Call the barangay office: (046) XXX-XXXX
• Provide your username and verify your identity
• Admin will reset your PIN remotely

**Important:**
• Your PIN will be reset to a temporary PIN
• You will be required to change it on first login
• Keep your new PIN secure

**Note:** For security reasons, PIN reset cannot be done online without admin verification.',
 'forgot pin, reset pin, lost pin, forgot password, reset password, cannot login, locked account',
 2);

-- Announcements Category FAQs
INSERT INTO faqs (category_id, question, answer, keywords, display_order) VALUES
(4, 'How can I view barangay announcements?',
 'You can view barangay announcements in several ways:

**1. SmartLias Website (Public)**
• Visit the home page at http://smartlias.barangaylias.com
• Announcements are displayed on the main page
• No login required

**2. SmartLias Account (Residents)**
• Log in to your account
• Go to the "Announcements" section
• View all published announcements
z
**3. SMS Notifications**
• Important announcements are sent via SMS
• Make sure your mobile number is updated in your profile

**Types of Announcements:**
• General announcements
• Health programs
• Activities and events
• Assistance programs
• Advisories and alerts',
 'announcements, view announcements, news, updates, notifications, what''s new, events',
 1),

(4, 'Why am I not receiving SMS notifications?',
 'If you''re not receiving SMS notifications, please check:

**1. Mobile Number**
• Verify your mobile number in your profile is correct
• Format: 09XXXXXXXXX (11 digits)
• Update it if necessary in Profile Settings

**2. Network Issues**
• Check if your phone has signal
• Try restarting your phone

**3. SMS Settings**
• Make sure SMS is not blocked on your phone
• Check if you have spam filters enabled

**4. Announcement Target**
• Not all announcements are sent via SMS
• SMS is sent only for important or targeted announcements

**Still having issues?**
Contact the barangay office to update your mobile number: (046) XXX-XXXX',
 'sms, not receiving sms, no sms, notifications, text message, alerts, mobile number',
 2);

-- General Category FAQs
INSERT INTO faqs (category_id, question, answer, keywords, display_order) VALUES
(6, 'What is SmartLias?',
 'SmartLias is the **official digital platform** of Barangay Lias, Imus, Cavite.

**Purpose:**
• Streamline barangay services and operations
• Provide easy access to barangay information
• Enable online document requests
• Facilitate communication between residents and officials

**Features:**
• 📄 Online document requests
• 📢 Real-time announcements and updates
• 📱 SMS notifications
• 👥 Resident profile management
• 💬 Chatbot assistance (FAQ support)

**Benefits:**
• Convenient 24/7 access
• Faster document processing
• Real-time updates
• Reduced need for physical visits
• Better communication

**Developed by:** Barangay Lias IT Team
**Launched:** 2025',
 'smartlias, what is smartlias, about, system, platform, website, app',
 1);

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON TABLE faq_categories IS 'FAQ categories for organizing questions';
COMMENT ON TABLE faqs IS 'Frequently Asked Questions with keyword-based search';
COMMENT ON TABLE chat_conversations IS 'Chat sessions between users and chatbot';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat conversations';

COMMENT ON COLUMN faqs.keywords IS 'Keywords for matching user queries (comma-separated or JSON). Used for search and auto-matching.';
COMMENT ON COLUMN faqs.view_count IS 'Number of times this FAQ was viewed or matched';
COMMENT ON COLUMN faqs.helpful_count IS 'Number of times users marked this FAQ as helpful';
COMMENT ON COLUMN faqs.not_helpful_count IS 'Number of times users marked this FAQ as not helpful';

COMMENT ON COLUMN chat_messages.was_helpful IS 'User feedback: NULL=no feedback, 1=helpful, 0=not helpful';

-- ============================================
-- COMPLETION
-- ============================================

SELECT 'Chatbot FAQ System Schema Created Successfully!' AS status;
