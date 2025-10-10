# Residents Document Requests - Requirements

## Overview
Residents should be able to request barangay documents through the system. Admins and staff will process, approve, reject, or mark these requests as ready for pickup. Once ready, the resident must visit the barangay office to claim the document, after which the admin can set it as "Claimed".

Admins and staff can view and generate the requested documents (PDF format) within the system and fill in necessary resident details (e.g., name, address) before printing.

---

## Task List

### 1. Resident Dashboard

**General Notes**
- Existing UI/UX patterns from other modules should be reused.
- New components should be placed under:  
  `components/authenticated/resident/<file-name>.jsx`

#### Document Requests Sidebar
- Display all active (`is_active = 1`) documents from `document_catalog`.
- Each document type should open a slide-in panel similar to `AnnouncementView`.
- Residents should be able to:
  - Submit required fields (e.g., **Purpose** as a dropdown, **Notes** optional).
  - See validation messages (frontend + backend toast notifications).
  - Cancel or confirm the submission via a confirmation modal.
  - Receive a toast notification upon successful submission.
  - Request the same document type again **only** if the previous request is `Claimed` or `Rejected`.

#### My Requests Sidebar
- Include a dropdown listing all requests with their `Document Request ID` (e.g., `REQ-2025-001`).
- Allow filtering by status:
  - Pending = 0
  - Processing = 1
  - Rejected = 2
  - Ready for Pickup = 3
  - Claimed = 4
- Display human-readable dates (e.g., "Yesterday", "Today", "Oct 3, 2025") with 12-hour time format.
- Search bar not required.
- When a request is selected:
  - Show request timeline/history (like the **My Requests** page).
  - Open a slide-in panel (similar to `AnnouncementView`) with:
    - **Header:** Request Details (with Close button)
    - **Document Type** (e.g., Barangay Clearance)
    - **Status:** e.g., Pending
    - **Purpose, Notes**
    - **Fee:** "Payable on Pickup" or "Paid" (if Claimed)
    - **Requested Date, Completed Date, or Rejected Date** (if applicable)
- Rejected requests cannot be resubmitted. Residents can reapply via the main Document Requests page.

#### Transaction SQLs
- Insert into `document_requests` table with status = Pending.
- Insert into `document_requests_logs` based on actions by staff/admin.

---

### 2. Admin Dashboard

#### Overview
Admins and staff should manage document requests with full CRUD workflow visibility and basic analytics.

#### Admin Features
- Display total counts:
  - Pending
  - Ready for Pickup
  - Completed
  - Denied
- Default date range: **Last 7 days**, with filters for **30 days** and **90 days**.
- Basic analytics for requests overview.
- Search by **Request ID** or **Resident Name**.
- Filter by **Status:**
  - Pending
  - Processing
  - Rejected
  - Ready for Pickup
  - Claimed
- Filter by **Document Type** (static filter, not dynamic).
- Sorting:
  - Sortable columns
  - Default sorting: latest first

#### Table Columns
- Request ID  
- Resident Name  
- Document Type  
- Purpose  
- Requested Date (created_at)  
- Status  

#### Document View (Slide-In Panel)
- Slide-in panel (`DocumentView` component) similar to existing view designs.
- Show content and available actions based on status.

##### Status-Based Views

**Pending**
- View request details (user, purpose, notes)
- Actions: Close, Reject (with confirmation modal), Process

**Processing**
- Show PDF viewer inside the panel.
- Populate document data (Name, Address, etc.)
- Actions: Close, Reject (with required remarks), Mark as Ready

**Ready for Pickup**
- Show PDF viewer (readonly)
- Actions: Close, Mark as Completed

**Claimed**
- Display summary; no further action required.

---

### 3. Test Scenarios

**Document Types to Start:**
1. **Electric Permit**
   - Resident Full Name (e.g., John Doe S. Santos)
   - Address

2. **Barangay Clearance**
   - Resident Full Name (e.g., John Doe S. Santos)
   - Address
   - Age
   - Status
   - Citizenship (Default: Filipino)

---

### 4. Architecture and Design Guidelines

- Follow existing patterns for success, validation, and error handling.
- Keep implementation efficient and straightforward.
- Prioritize clean, readable, and maintainable code.
- Ensure a high-quality UI/UX that aligns with the rest of the system.
- PDF generation should work seamlessly within the admin view.
- Database schema changes allowed if needed for better performance and clarity.

---

### 5. Completion Criteria
- Working document request flow and PDF viewer integration.
  - react-doc-viewer
  - tailwind-pdf-viewer (https://github.com/KhoiUna/tailwind-pdf-viewer)
- Proper status transitions and data handling.
- Consistent UI/UX with other system modules.
- Reliable backend logic and optimized database operations.

---

### 6. Notes
- All suggestions and improvements must be confirmed before implementation.
- separate the DATA LAYER to what we want to see in FRONTEND. Like for example the REQ-YEAR-001 its not important in the backedn and data layer to understand. Its just for frontend use cases.
- As much as possible we want to be a lightweight application.
