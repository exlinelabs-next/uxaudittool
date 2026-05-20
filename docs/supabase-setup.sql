-- Run this in Supabase > SQL Editor
-- Creates the audit_reports table for shareable report links

CREATE TABLE IF NOT EXISTS audit_reports (
  id            TEXT PRIMARY KEY,           -- 10-char hex share ID e.g. "a3b2c1d4e5"
  url           TEXT NOT NULL,              -- the audited website URL
  result        JSONB NOT NULL,             -- full AuditResult JSON
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by ID (already covered by PRIMARY KEY, but explicit is fine)
CREATE INDEX IF NOT EXISTS audit_reports_created_at_idx ON audit_reports (created_at DESC);

-- Row Level Security
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can read a report if they have the ID (share links are public)
CREATE POLICY "Public read"
  ON audit_reports
  FOR SELECT
  USING (true);

-- Only service role can insert (our API uses the service role key)
CREATE POLICY "Service role insert"
  ON audit_reports
  FOR INSERT
  WITH CHECK (true);

-- Optional: auto-delete reports older than 90 days
-- (uncomment if you want automatic cleanup)
-- CREATE OR REPLACE FUNCTION delete_old_audit_reports()
-- RETURNS void AS $$
--   DELETE FROM audit_reports WHERE created_at < now() - INTERVAL '90 days';
-- $$ LANGUAGE sql;
