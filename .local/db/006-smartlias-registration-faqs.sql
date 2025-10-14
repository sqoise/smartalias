-- ============================================
-- SmartLIAS App Registration FAQs
-- ============================================
-- Description: Add FAQs about registering and using SmartLIAS app
-- Date: 2025-10-15

-- Add new category for SmartLIAS App
INSERT INTO faq_categories (category_name, description, icon, display_order, is_active) 
VALUES ('SmartLIAS App', 'Using the SmartLIAS digital platform', 'app', 0, 1)
ON CONFLICT DO NOTHING;

-- Insert SmartLIAS registration FAQs
INSERT INTO faqs (category_id, question, answer, keywords, is_active, created_by) VALUES

-- Greetings
((SELECT id FROM faq_categories WHERE category_name = 'SmartLIAS App'), 
 'Hi! How can I help you?', 
 'Kumusta! Welcome to SmartLIAS, your digital platform for Barangay Lias services.

I can help you with:
• How to register for SmartLIAS account
• Document request procedures
• Account approval status
• Login and security issues
• App features and navigation

What would you like to know about SmartLIAS?',
 'hi, hello, kumusta, hey, good morning, good afternoon, good evening, kamusta, musta',
 1, 1),

-- App Registration
((SELECT id FROM faq_categories WHERE category_name = 'SmartLIAS App'), 
 'How do I register for SmartLIAS account?', 
 'To create your SmartLIAS account:

1. Visit the SmartLIAS login page
2. Click "Create Account" or "Register"
3. Fill out the registration form with:
   - Username (must be unique)
   - Email address
   - 6-digit PIN (for login security)
   - Personal information
   - Upload valid ID (front and back)
4. Click "Submit Registration"
5. Wait for admin approval (usually 1-2 business days)
6. You will receive confirmation once approved
7. Login with your username and PIN

Requirements:
- Must be a registered resident of Barangay Lias
- Valid government-issued ID
- Active email address
- Proof of residency',
 'register, registration, create account, sign up, smartlias, app, account, how to register, paano mag register',
 1, 1),

-- Account Approval
((SELECT id FROM faq_categories WHERE category_name = 'SmartLIAS App'), 
 'How long does account approval take?', 
 'Account approval process:

Timeline: 1-2 business days
- Weekdays: Usually within 24 hours
- Weekends/Holidays: Next business day

What happens during approval:
1. Admin verifies your submitted documents
2. Cross-checks with barangay resident records
3. Validates your ID and personal information
4. Activates your account if all checks pass

You can login once approved. Check your email for approval notification, or try logging in after 24 hours.',
 'approval, pending, waiting, how long, verification, account status',
 1, 1),

-- Login Issues
((SELECT id FROM faq_categories WHERE category_name = 'SmartLIAS App'), 
 'I forgot my PIN, what should I do?', 
 'If you forgot your PIN:

1. Contact the barangay office
2. Visit in person with valid ID
3. Request PIN reset from admin
4. Admin will reset your PIN
5. You will be required to change PIN on next login

For security reasons, PIN reset must be done in person at the barangay office. This protects your account from unauthorized access.',
 'forgot PIN, reset PIN, password reset, cannot login, locked account',
 1, 1),

-- App Features
((SELECT id FROM faq_categories WHERE category_name = 'SmartLIAS App'), 
 'What can I do in SmartLIAS app?', 
 'SmartLIAS features for residents:

DOCUMENT REQUESTS:
- Request barangay clearance online
- Request certificates and permits
- Track request status in real-time
- View processing timeline
- Receive notifications when ready

ANNOUNCEMENTS:
- View barangay announcements
- Get updates on programs and events
- Stay informed about community news

PROFILE MANAGEMENT:
- Update your contact information
- View your resident profile
- Manage account settings

AI ASSISTANT:
- Ask questions about barangay services
- Get instant answers 24/7
- Learn about requirements and procedures

All services available anytime, anywhere!',
 'features, what can I do, services, functions, smartlias app, online services',
 1, 1),

-- Document Request Process
((SELECT id FROM faq_categories WHERE category_name = 'SmartLIAS App'), 
 'How do I request documents through SmartLIAS?', 
 'To request documents online:

1. Login to your SmartLIAS account
2. Go to "My Requests" or "Document Requests"
3. Click "New Request" or "Request Document"
4. Select document type (Barangay Clearance, Certificate, etc.)
5. Fill out the required form
6. Review and submit your request
7. Wait for processing
8. Track status in "My Requests"
9. Get notified when ready for pickup/delivery

Processing time: 1-3 business days
Pickup: Barangay office during office hours
Payment: Upon pickup (bring exact amount)

You can track your request status anytime in the app!',
 'request document, how to request, online request, document process, barangay clearance online',
 1, 1),

-- Account Security
((SELECT id FROM faq_categories WHERE category_name = 'SmartLIAS App'), 
 'Is my personal information safe in SmartLIAS?', 
 'SmartLIAS Security Features:

DATA PROTECTION:
- All personal data is encrypted
- Secure database storage
- Admin-only access to sensitive info
- Regular security updates

PRIVACY MEASURES:
- Your data is never shared with third parties
- Used only for barangay services
- Compliant with Data Privacy Act
- No spam or marketing messages

ACCOUNT SECURITY:
- PIN-based authentication
- Account lockout after failed attempts
- Secure password hashing
- Admin approval required

AI CHATBOT PRIVACY:
- Do not share personal details in chat
- Conversations are logged for service improvement
- Personal information automatically filtered
- For sensitive matters, visit office in person

Your privacy and security are our top priorities!',
 'security, safe, privacy, data protection, personal information, secure',
 1, 1);

-- Update display_order for SmartLIAS App category to appear first
UPDATE faq_categories SET display_order = 0 WHERE category_name = 'SmartLIAS App';
UPDATE faq_categories SET display_order = display_order + 1 WHERE category_name != 'SmartLIAS App';

-- Reset sequence
SELECT setval('faqs_id_seq', (SELECT MAX(id) FROM faqs));

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'SmartLIAS Registration FAQs Added!' AS status;
SELECT COUNT(*) || ' new FAQs added' AS result FROM faqs WHERE category_id = (SELECT id FROM faq_categories WHERE category_name = 'SmartLIAS App');
