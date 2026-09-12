-- Migration: 20260903000000_step2_drop_extra_tables.sql
-- Description: Drop out-of-scope tables from initial SaaS / Video platform
-- Preserves: courses, rate_limit_config, api_logs, ip_blocklist, suspicious_activity
-- Preserves Core Spec: semesters, subjects, units, downloads, download_logs, comments, posts

-- 1. Drop dependent child tables first to satisfy foreign keys
DROP TABLE IF EXISTS video_views CASCADE;
DROP TABLE IF EXISTS video_likes CASCADE;
DROP TABLE IF EXISTS video_notes CASCADE;
DROP TABLE IF EXISTS video_comments CASCADE;
DROP TABLE IF EXISTS lecturer_subscriptions CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS lecturers CASCADE;

DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;

DROP TABLE IF EXISTS referral_signups CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS trials CASCADE;

DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS platform_config CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS admin_activity_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS page_analytics CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS popular_materials CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;

-- Legacy flat materials table (replaced by units + downloads)
DROP TABLE IF EXISTS study_materials CASCADE;
