# Hardcoded Template Constants Cleanup

## Date: October 13, 2025

## Summary
Final cleanup to remove ALL hardcoded template constants from the codebase. The system is now **100% database-driven** for both fees and templates.

---

## What Was Removed

### 1. **documentConstants.js** - Removed Template Constants
```javascript
// REMOVED: Hardcoded template arrays
const AVAILABLE_TEMPLATES = [
  'electrical_permit',
  'barangay_clearance',
  'certificate_of_residency'
]

const TEMPLATE_FILES = {
  'electrical_permit': 'electrical_permit_template.docx',
  'barangay_clearance': 'barangay_clearance_template.docx',
  'certificate_of_residency': 'certificate_of_residency_template.docx'
}

// REMOVED: Template helper functions
const hasTemplate = (documentType) => { ... }
const getTemplateFile = (documentType) => { ... }
```

**After Cleanup:**
```javascript
// Only document type mappings remain (for display formatting)
const DOCUMENT_TYPES = { ... }
const DOCUMENT_TYPE_KEYS = { ... }

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_KEYS,
  formatDocumentType,
  getDocumentTypeKey
}
```

### 2. **documentController.js** - Refactored to Use Database

**Before:**
```javascript
const { 
  formatDocumentType, 
  hasTemplate, 
  getTemplateFile, 
  AVAILABLE_TEMPLATES 
} = require('../config/documentConstants')

const getAvailableTemplates = async (req, res) => {
  const availableTemplates = []
  
  for (const type of AVAILABLE_TEMPLATES) {
    const exists = await modernDocxService.templateExists(type)
    if (exists) {
      availableTemplates.push({
        type,
        name: formatDocumentType(type),
        available: true
      })
    }
  }
  // ...
}
```

**After:**
```javascript
const { formatDocumentType } = require('../config/documentConstants')
const DocumentRequestRepository = require('../repositories/DocumentRequestRepository')

const getAvailableTemplates = async (req, res) => {
  // Query database for all document types that have templates
  const documents = await DocumentRequestRepository.getAllCatalog()
  
  // Filter documents that have template filenames
  const availableTemplates = documents
    .filter(doc => doc.filename) // Only include documents with template files
    .map(doc => ({
      type: doc.title.toLowerCase().replace(/\s+/g, '_'),
      name: doc.title,
      filename: doc.filename,
      available: true
    }))
  
  res.json({
    success: true,
    templates: availableTemplates
  })
}
```

---

## System State: 100% Database-Driven

### ✅ Document Fees
- **Source**: `document_catalog.fee` column
- **Used By**: Frontend UI, backend API, generated DOCX documents
- **No Hardcoded Values**: All fees come from database

### ✅ Template Files
- **Source**: `document_catalog.filename` column
- **Used By**: 
  - `modernDocxService.js` - Queries database for template filename
  - `DocumentsContainer.jsx` - Checks `document.templateFilename` for availability
  - `getAvailableTemplates()` - Returns templates from database
- **No Hardcoded Arrays**: All template info comes from database

### ✅ Document Types
- **Source**: `document_catalog.title` column
- **Used By**: All document operations
- **Constants Kept**: Only display formatting mappings (DOCUMENT_TYPES) remain for UI purposes

---

## Benefits of Full Database-Driven System

1. **Zero Code Changes for New Documents**
   ```sql
   -- Admin adds new document type (no code deployment needed!)
   INSERT INTO document_catalog (title, description, fee, filename)
   VALUES ('Building Permit', 'Permit for construction', 500.00, 'building_permit_template.docx');
   ```

2. **Dynamic Template Detection**
   - Add template file to `backend/templates/`
   - Set `filename` in database
   - System automatically detects and enables document generation

3. **Flexible Fee Management**
   ```sql
   -- Change fees without code changes
   UPDATE document_catalog SET fee = 200.00 WHERE title = 'Electrical Permit';
   ```

4. **Centralized Configuration**
   - All document settings in one place (database)
   - No scattered constants across codebase
   - Easy to audit and maintain

5. **Scalability**
   - Add unlimited document types
   - No hardcoded limits
   - System grows with data, not code

---

## What Remains in Constants

Only **display formatting helpers** remain:

```javascript
// backend/config/documentConstants.js

// Maps internal keys to display names (for backward compatibility)
const DOCUMENT_TYPES = {
  'electrical_permit': 'Electrical Permit',
  'fence_permit': 'Fence Permit',
  // ... etc
}

// Helper functions for formatting
formatDocumentType(type)    // Convert key to display name
getDocumentTypeKey(display) // Convert display name to key
```

**Purpose**: These are pure utility functions for string formatting, not configuration data.

---

## Testing the Cleanup

### 1. Test Template Endpoint
```bash
curl -X GET http://localhost:9000/api/documents/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "templates": [
    {
      "type": "electrical_permit",
      "name": "Electrical Permit",
      "filename": "electrical_permit_template.docx",
      "available": true
    },
    {
      "type": "fence_permit",
      "name": "Fence Permit",
      "filename": "fence_permit_template.docx",
      "available": true
    }
  ]
}
```

### 2. Verify Database Query
```sql
-- Check what templates will be returned
SELECT id, title, fee, filename 
FROM document_catalog 
WHERE filename IS NOT NULL
ORDER BY title;
```

### 3. Test Document Generation
1. Create document request as resident
2. Process request as admin
3. Verify "Process" button appears (checks `templateFilename`)
4. Generate document
5. Verify correct template used and fee displayed

---

## Migration Impact

### No Breaking Changes
- All existing functionality preserved
- System behavior unchanged from user perspective
- Only internal implementation changed

### Files Modified
1. ✅ `backend/config/documentConstants.js` - Removed template constants
2. ✅ `backend/controllers/documentController.js` - Refactored to use database
3. ✅ (Already done) `backend/services/modernDocxService.js` - Uses database
4. ✅ (Already done) `frontend/components/authenticated/admin/DocumentsContainer.jsx` - Uses `templateFilename`

### Database Requirements
Ensure all documents have proper `filename` values:

```sql
-- Update existing documents
UPDATE document_catalog SET filename = 'electrical_permit_template.docx' 
WHERE title = 'Electrical Permit';

UPDATE document_catalog SET filename = 'fence_permit_template.docx' 
WHERE title = 'Fence Permit';

UPDATE document_catalog SET filename = 'barangay_clearance_template.docx' 
WHERE title = 'Barangay Clearance';

-- Documents without templates should have NULL filename
UPDATE document_catalog SET filename = NULL 
WHERE title IN (
  'Certificate of Good Moral',
  'Certificate of Indigency (Medical)',
  'Certificate of Indigency (Financial)',
  'Business Permit Clearance'
);
```

---

## Conclusion

The SMARTLIAS document system is now **fully database-driven**:

✅ **Fees**: Controlled by `document_catalog.fee`  
✅ **Templates**: Controlled by `document_catalog.filename`  
✅ **Document Types**: Stored in `document_catalog.title`  
✅ **No Hardcoded Configuration**: All business logic is data-driven  

This makes the system:
- **Maintainable**: Changes require database updates, not code changes
- **Scalable**: Add unlimited document types without code modifications
- **Flexible**: Admins can manage document catalog through UI (future feature)
- **Professional**: Separation of configuration (data) and code (logic)

---

**Next Steps:**
1. Restart backend server to load changes
2. Test `/api/documents/templates` endpoint
3. Verify all document workflows still function
4. Consider building admin UI for managing document catalog (future)
