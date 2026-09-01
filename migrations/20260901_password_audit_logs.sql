-- Migration: password_reset_audits
-- Replaces manual SQL-script workflow; never stores plaintext or hash

CREATE TABLE IF NOT EXISTS password_reset_audits (
  id                        TEXT PRIMARY KEY,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_email               TEXT NOT NULL,
  actor_role                TEXT NOT NULL,
  actor_ip                  TEXT NOT NULL,
  user_agent                TEXT NOT NULL,
  action                    TEXT NOT NULL CHECK (action IN ('set-custom','reset-default')),
  batch_id                  TEXT,
  student_count_requested   INT NOT NULL,
  student_ids               JSONB NOT NULL DEFAULT '[]',
  student_emails            JSONB NOT NULL DEFAULT '[]',
  success_count             INT NOT NULL,
  failure_count             INT NOT NULL,
  failures                  JSONB NOT NULL DEFAULT '[]'
  -- NOTE: no plaintext, no password_hash column — enforced by app layer
);

CREATE INDEX IF NOT EXISTS idx_password_audits_created_at ON password_reset_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_audits_actor ON password_reset_audits(actor_email);
CREATE INDEX IF NOT EXISTS idx_password_audits_action ON password_reset_audits(action);
CREATE INDEX IF NOT EXISTS idx_password_audits_batch ON password_reset_audits(batch_id) WHERE batch_id IS NOT NULL;

-- RLS suggestion (enable if using Supabase):
-- ALTER TABLE password_reset_audits ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY admin_read ON password_reset_audits FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','super_admin','university_admin'));
-- CREATE POLICY admin_insert ON password_reset_audits FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin','super_admin','university_admin'));
