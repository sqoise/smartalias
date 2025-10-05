-- Migration: Add label field to announcements table
-- Date: 2024-10-05
-- Description: Add optional label field for announcement categorization

ALTER TABLE announcements 
ADD COLUMN label VARCHAR(100) DEFAULT NULL COMMENT 'Optional label for categorization (e.g., Important, Event, Notice)';

-- Add index for efficient label-based queries
CREATE INDEX idx_announcements_label ON announcements(label);
