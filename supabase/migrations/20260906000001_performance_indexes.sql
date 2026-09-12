-- ================================================================
-- Performance Indexes Migration for PharmaPaper
-- Optimizes foreign key joins and slug lookups
-- ================================================================

-- 1. Foreign Key Indexes for Fast Joins
CREATE INDEX IF NOT EXISTS idx_subjects_semester_id ON subjects (semester_id);
CREATE INDEX IF NOT EXISTS idx_units_subject_id ON units (subject_id);
CREATE INDEX IF NOT EXISTS idx_downloads_unit_id ON downloads (unit_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_unit_id ON download_logs (unit_id);

-- 2. Lookup Slug Indexes for Fast WHERE slug = ... Lookups
CREATE INDEX IF NOT EXISTS idx_semesters_slug ON semesters (slug);
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON subjects (slug);
CREATE INDEX IF NOT EXISTS idx_units_slug ON units (slug);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts (slug);

-- 3. Composite Indexes for Content Filtering & Moderation
CREATE INDEX IF NOT EXISTS idx_comments_parent_approved ON comments (parent_type, parent_id, approved);
CREATE INDEX IF NOT EXISTS idx_subjects_semester_order ON subjects (semester_id, order_index);
CREATE INDEX IF NOT EXISTS idx_units_subject_order ON units (subject_id, order_index);
