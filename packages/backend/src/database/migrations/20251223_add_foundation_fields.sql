-- Migration: Add foundation fields to pages table
-- Adds founded_by (text), founded_date (text), and founded_date_precision (text) columns

ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS founded_by TEXT,
ADD COLUMN IF NOT EXISTS founded_date TEXT,
ADD COLUMN IF NOT EXISTS founded_date_precision TEXT CHECK (founded_date_precision IN ('year', 'month', 'day'));

COMMENT ON COLUMN pages.founded_by IS 'Founder name(s)';
COMMENT ON COLUMN pages.founded_date IS 'Foundation date in ISO format (YYYY, YYYY-MM, or YYYY-MM-DD)';
COMMENT ON COLUMN pages.founded_date_precision IS 'Display precision for founded_date: year, month, or day';
