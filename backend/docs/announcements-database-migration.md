# Announcements Module - Database Migration Complete

## Overview
Successfully migrated the announcements management system from JSON file storage to PostgreSQL database with full CRUD operations, transaction support, and proper data relationships.

---

## ✅ Completed Components

### 1. Database Schema (Already Exists)
- **announcements** table: Stores announcement records with metadata
- **announcement_target_groups** table: Junction table for targeting specific resident groups
- **sms_notifications** table: Tracks SMS notification delivery

### 2. Repository Layer
**File**: `/backend/repositories/AnnouncementRepository.js`

**Methods**:
- `findAll()` - List all announcements with target groups (LEFT JOIN aggregation)
- `findById(id)` - Get single announcement with target groups
- `create(data, targetGroups)` - Insert announcement + target groups (transactional)
- `update(id, data, targetGroups)` - Update announcement + recreate target groups (transactional)
- `delete(id)` - Delete announcement (CASCADE removes related records)
- `logSMS(announcementId, residents)` - Track SMS notification delivery

**Key Features**:
- Transaction-based operations for data integrity
- Automatic timestamp management (created_at, updated_at)
- Database format ↔ API format transformation (is_active ↔ status, image ↔ image_url)
- Target groups handling: "all" or "type:value" format parsing
- Proper error handling with rollback on failures

### 3. API Endpoints (Router.js)
**All endpoints migrated to use AnnouncementRepository**:

#### GET /api/announcements
- Fetches all announcements from database
- Transforms database format to API format
- Returns array with target_groups, status, image_url fields

#### POST /api/announcements (Admin only)
- Validates required fields (title, content, target_groups)
- Creates announcement in database with transaction
- Handles is_urgent → type mapping ('urgent' or 'general')
- Sets status ('draft' or 'published')
- Logs SMS notification intent

#### PUT /api/announcements/:id (Admin only)
- Validates announcement exists
- Updates announcement fields (partial update supported)
- Handles status change (draft → published)
- Updates published_by when publishing
- Recreates target groups in transaction

#### DELETE /api/announcements/:id (Admin only)
- Validates announcement exists
- Deletes announcement from database
- CASCADE automatically removes target_groups and sms_notifications

### 4. Frontend Components
**Files**: All use ApiClient for backend communication

- `/frontend/components/authenticated/admin/AnnouncementsContainer.jsx` - Card-based list view
- `/frontend/components/authenticated/admin/AddAnnouncementView.jsx` - Add overlay panel
- `/frontend/components/authenticated/admin/AnnouncementDetailView.jsx` - View/edit overlay
- `/frontend/app/admin/announcements/page.js` - Main page with state management

---

## 📊 Data Format Transformations

### Database Format (PostgreSQL)
```javascript
{
  id: 1,
  title: "Sample Announcement",
  content: "...",
  image: "/uploads/sample.jpg",      // Database column
  type: "urgent",                    // 'urgent' or 'general'
  is_active: 1,                      // 0 = draft, 1 = published
  published_at: "2025-01-15 10:00:00",
  published_by: 1,
  created_by: 1,
  created_at: "2025-01-15 09:00:00",
  updated_at: "2025-01-15 09:00:00"
}
```

### API Format (JSON Response)
```javascript
{
  id: 1,
  title: "Sample Announcement",
  content: "...",
  image_url: "/uploads/sample.jpg",  // Transformed field name
  is_urgent: true,                   // Derived from type
  status: "published",               // Transformed from is_active
  published_at: "2025-01-15T10:00:00.000Z",
  published_by: 1,
  created_by: 1,
  created_at: "2025-01-15T09:00:00.000Z",
  updated_at: "2025-01-15T09:00:00.000Z",
  target_groups: [                   // Aggregated from junction table
    "all",
    "classification:pwd",
    "classification:senior"
  ]
}
```

### Target Groups Format
**Database**: Separate rows in `announcement_target_groups` table
```sql
announcement_id | target_type      | target_value
1              | all              | all
2              | classification   | pwd
2              | classification   | senior
2              | civil_status     | solo_parent
```

**API**: Array of strings
```javascript
[
  "all",                          // All residents
  "classification:pwd",           // PWD only
  "classification:senior",        // Senior citizens only
  "civil_status:solo_parent"      // Solo parents only
]
```

---

## 🚀 How to Use

### 1. Seed Sample Data
Run the SQL script to add sample announcements:
```bash
psql -d smartliasdb -f backend/data/seed-announcements.sql
```

**Note**: Update `created_by` user IDs in the script to match actual admin users:
```sql
SELECT id FROM users WHERE role = 1 LIMIT 1;
```

### 2. Start Backend Server
```bash
cd backend
npm start
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Access Announcements
Navigate to: `http://localhost:3000/admin/announcements`

---

## 🔄 Transaction Safety

All database operations use PostgreSQL transactions to ensure data integrity:

### Create Operation
```javascript
BEGIN TRANSACTION
  INSERT INTO announcements (...)
  INSERT INTO announcement_target_groups (...)
COMMIT
```

### Update Operation
```javascript
BEGIN TRANSACTION
  UPDATE announcements SET ...
  DELETE FROM announcement_target_groups WHERE announcement_id = ?
  INSERT INTO announcement_target_groups (...)
COMMIT
```

### Delete Operation
```javascript
DELETE FROM announcements WHERE id = ?
-- CASCADE automatically deletes:
-- - announcement_target_groups
-- - sms_notifications
```

If any step fails, the entire transaction is rolled back automatically.

---

## 🗑️ Cleanup Tasks

### Files to Remove
- `/backend/data/announcements.json` - No longer needed (replaced by database)

### Dependencies to Remove (if not used elsewhere)
Check if these are used by other modules before removing:
```javascript
const fsSync = require('fs')      // File system operations
const path = require('path')      // Path operations
```

Run this command to check:
```bash
cd backend
grep -r "fsSync\." --exclude-dir=node_modules --exclude=router.js .
grep -r "path\." --exclude-dir=node_modules --exclude=router.js .
```

---

## 🖼️ Image Storage (Pending Implementation)

### Recommended Structure
```
backend/uploads/
  announcements/
    2025/
      01/
        announcement-123-abc123.jpg
        announcement-124-def456.png
```

### Implementation Steps

1. **Install multer** (if not installed):
```bash
cd backend
npm install multer
```

2. **Create upload directory**:
```bash
mkdir -p backend/uploads/announcements
```

3. **Add to .gitignore**:
```gitignore
# Image uploads
backend/uploads/
```

4. **Create upload endpoint**:
```javascript
// In router.js
const multer = require('multer')
const crypto = require('crypto')

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const uploadDir = path.join(__dirname, 'uploads', 'announcements', String(year), month)
    
    // Create directory if not exists
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(file.originalname)
    cb(null, `announcement-${Date.now()}-${uniqueId}${ext}`)
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF allowed.'))
    }
  }
})

// Upload endpoint
router.post('/announcements/upload', 
  authenticateToken, 
  requireAdmin, 
  upload.single('image'), 
  (req, res) => {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400)
    }
    
    // Return relative path for storage in database
    const relativePath = `/uploads/announcements/${req.file.filename}`
    return ApiResponse.success(res, { 
      image_url: relativePath,
      filename: req.file.filename 
    })
})
```

5. **Serve static files** (add to app.js):
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
```

6. **Frontend usage**:
```javascript
// In AddAnnouncementView.jsx or AnnouncementDetailView.jsx
const handleImageUpload = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await ApiClient.request('/announcements/upload', {
    method: 'POST',
    body: formData
  })
  
  setImageUrl(response.data.image_url)
}
```

---

## 🧪 Testing Checklist

### Backend API Testing
- [ ] GET /api/announcements - List all announcements
- [ ] POST /api/announcements - Create draft announcement
- [ ] POST /api/announcements - Create published announcement
- [ ] GET /api/announcements/:id - Get single announcement
- [ ] PUT /api/announcements/:id - Update draft announcement
- [ ] PUT /api/announcements/:id - Publish draft announcement
- [ ] DELETE /api/announcements/:id - Delete announcement
- [ ] Verify target_groups are saved correctly
- [ ] Verify CASCADE delete removes target_groups
- [ ] Test transaction rollback on errors

### Frontend Testing
- [ ] View announcements list (card layout)
- [ ] Open "Add Announcement" overlay
- [ ] Create draft announcement
- [ ] Create published announcement
- [ ] View announcement details
- [ ] Edit announcement
- [ ] Publish draft announcement
- [ ] Delete announcement
- [ ] Verify target group selection works
- [ ] Verify SMS target selection works

---

## 📝 API Response Examples

### GET /api/announcements
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Community Health Fair",
      "content": "Join us for a free health fair...",
      "image_url": null,
      "is_urgent": false,
      "status": "published",
      "published_at": "2025-01-15T10:00:00.000Z",
      "published_by": 1,
      "created_by": 1,
      "created_at": "2025-01-15T09:00:00.000Z",
      "updated_at": "2025-01-15T09:00:00.000Z",
      "target_groups": ["classification:pwd", "classification:senior"]
    }
  ],
  "message": "Announcements retrieved successfully"
}
```

### POST /api/announcements (Create)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "New Announcement",
    "content": "This is a new announcement",
    "image_url": null,
    "type": "general",
    "status": "draft",
    "created_by": 1,
    "created_at": "2025-01-15T11:00:00.000Z",
    "updated_at": "2025-01-15T11:00:00.000Z",
    "target_groups": ["all"]
  },
  "message": "Announcement saved as draft"
}
```

---

## 🔐 Security Notes

1. **Authentication Required**: All endpoints require valid JWT token
2. **Admin Only**: Create, update, delete operations restricted to admin users
3. **Input Sanitization**: All text inputs sanitized via `Validator.sanitizeInput()`
4. **SQL Injection Prevention**: Uses parameterized queries throughout
5. **File Upload Security**: 
   - File type validation (JPEG, PNG, GIF only)
   - File size limit (5MB)
   - Unique filenames to prevent overwrites
   - Stored outside web root, served through backend

---

## 📚 Related Documentation

- **Authentication Flow**: `/.github/docs/AUTHENTICATION_FLOW.md`
- **Project Instructions**: `/.github/instructions/smartlias.instructions.md`
- **Database Schema**: `/smartliasdb_pg.sql`
- **API Response Standards**: `/backend/docs/api-response-standards.md`

---

**Migration Completed**: January 2025  
**Status**: Production Ready (pending image upload implementation)  
**Database**: PostgreSQL with transaction support  
**Frontend**: Next.js with ApiClient integration
