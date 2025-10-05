-- Migration: Update image field comments for clarity
-- Date: October 5, 2025
-- Description: Update image field documentation for optimized storage

-- Update the image field comment for clarity
COMMENT ON COLUMN announcements.image IS 'Path to optimized web image (e.g., /uploads/announcements/2024/10/image.jpg)';

-- Display current table structure
\d announcements;
