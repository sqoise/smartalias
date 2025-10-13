# Template Filename from Database Implementation

## Problem
Document templates were hardcoded in `documentConstants.js`, so new document types with templates (like "Fence Permit") showed "Template not available" even though the template file existed.

Example:
- `fence_permit_template.docx` exists in `backend/templates/`
- But was not in the hardcoded `AVAILABLE_TEMPLATES` array
- Result: System said template not available

## Solution
Use the `filename` field from the `document_catalog` table in the database instead of hardcoded template mappings.

## Changes Made

### 1. Backend - Document Request Repository
**File**: `backend/repositories/DocumentRequestRepository.js`

**Added new methods:**
```javascript
// Get document by title (to fetch template filename)
static async getDocumentByTitle(title)

// Get document by ID (to fetch template filename)
static async getDocumentById(documentId)
```

**Updated searchRequests query:**
```sql
SELECT 
  dr.id,
  ...
  dc.title as document_type,
  dc.filename as template_filename,  -- Added this line
  ...
FROM document_requests dr
```

### 2. Backend - Modern DOCX Service
**File**: `backend/services/modernDocxService.js`

**Before:**
```javascript
const { getTemplateFile, hasTemplate } = require('../config/documentConstants')

async generateDocument(templateType, residentData) {
  const templatePath = this.getTemplatePath(templateType)  // Used hardcoded mapping
  ...
}
```

**After:**
```javascript
const DocumentRequestRepository = require('../repositories/DocumentRequestRepository')

async generateDocument(documentType, residentData) {
  // Get document from database to retrieve template filename
  const documentInfo = await DocumentRequestRepository.getDocumentByTitle(documentType)
  
  if (!documentInfo || !documentInfo.filename) {
    throw new Error(`No template file configured for document type: ${documentType}`)
  }

  const templatePath = path.join(this.templateDir, documentInfo.filename)  // Use database filename
  ...
}
```

### 3. Frontend - Admin Documents Page
**File**: `frontend/app/admin/documents/page.js`

**Added template_filename to mapping:**
```javascript
applications = applicationsResponse.data.requests.map(request => ({
  ...
  documentType: request.document_type,
  templateFilename: request.template_filename,  // Added this line
  ...
}))
```

### 4. Frontend - Documents Container
**File**: `frontend/components/authenticated/admin/DocumentsContainer.jsx`

**Before:**
```javascript
import { checkDocxTemplate } from '../../../lib/constants'

{checkDocxTemplate(document.documentType) && (
  <button>Process</button>
)}
```

**After:**
```javascript
// No need to import checkDocxTemplate anymore

{document.templateFilename && (
  <button>Process</button>
)}
```

## Database Schema (Already Correct)
The `document_catalog` table already has the `filename` field:

```sql
CREATE TABLE "public"."document_catalog" (
    "id" SERIAL PRIMARY KEY,
    "title" character varying(255) NOT NULL,
    "description" text,
    "filename" character varying(255),  -- Template filename (e.g., 'fence_permit_template.docx')
    "fee" numeric(10,2) DEFAULT 0.00,
    "is_active" integer DEFAULT 1,
    ...
);
```

## How It Works Now

### 1. Adding a New Document Type with Template
```sql
INSERT INTO document_catalog (title, description, fee, filename, is_active)
VALUES (
  'Fence Permit',
  'Permit for fence construction',
  500.00,
  'fence_permit_template.docx',  -- Just add the filename here!
  1
);
```

### 2. System Automatically Detects Template
- Backend fetches `filename` from database
- Frontend checks if `templateFilename` exists
- If filename exists → "Process" button appears
- If filename is NULL → Template not available message

### 3. Document Generation
- Backend calls `DocumentRequestRepository.getDocumentByTitle(documentType)`
- Gets the `filename` field from database
- Looks for template file in `backend/templates/{filename}`
- Generates document using that template

## Benefits

✅ **No Code Changes**: Add new document types with templates just by updating the database
✅ **Flexible**: Each document type can have its own template file
✅ **Database-Driven**: Template availability is controlled in one place (database)
✅ **Scalable**: Easy to add, remove, or update templates
✅ **No Hardcoding**: No need to update `documentConstants.js` for new templates

## Testing

### Verify Fence Permit Template Works
1. **Check database has filename:**
   ```sql
   SELECT title, filename FROM document_catalog WHERE title = 'Fence Permit';
   ```
   Expected: `filename = 'fence_permit_template.docx'`

2. **Check template file exists:**
   ```bash
   ls backend/templates/fence_permit_template.docx
   ```

3. **Create a request:**
   - Log in as resident
   - Request a Fence Permit
   
4. **Process the request (Admin):**
   - Should see "Process" button (not "Template not available")
   - Click Process
   - Status changes to "Processing"
   - Download document
   - Should generate properly with fence permit data

## Migration Path for Existing Documents

If you have documents without `filename` set:

```sql
-- Update existing documents with their template filenames
UPDATE document_catalog SET filename = 'electrical_permit_template.docx' WHERE title = 'Electrical Permit';
UPDATE document_catalog SET filename = 'fence_permit_template.docx' WHERE title = 'Fence Permit';
UPDATE document_catalog SET filename = 'barangay_clearance_template.docx' WHERE title = 'Barangay Clearance';
-- Add more as needed...

-- Documents without templates should have filename = NULL
UPDATE document_catalog SET filename = NULL WHERE title = 'Certificate of Indigency (Medical)';
```

## Cleanup (Optional)

You can now remove unused constants from `documentConstants.js`:
- `AVAILABLE_TEMPLATES` - No longer needed
- `TEMPLATE_FILES` - No longer needed
- `getTemplateFile()` - No longer needed
- `hasTemplate()` - No longer needed

These are kept for backward compatibility but not used anymore.
