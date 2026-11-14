-- ARMS Talent Partners proposed PostgreSQL schema, NOT applied or vendor-configured.
-- Use a dedicated application schema, no public direct writes, strict role-checked server access.
-- Codex must add migrations, access controls/RLS (according to chosen host), backups and tests.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  industry_slug text NOT NULL CHECK (industry_slug IN ('warehousing-fulfillment','transportation-drivers','cafes-hospitality','other')),
  location text NOT NULL,
  employment_type text NOT NULL,
  employer_display_name text,
  payroll_model text CHECK (payroll_model IN ('arms','client','undecided')),
  experience_label text,
  salary_min_inr integer CHECK (salary_min_inr IS NULL OR salary_min_inr >= 0),
  salary_max_inr integer CHECK (salary_max_inr IS NULL OR salary_max_inr >= 0),
  salary_period text CHECK (salary_period IN ('monthly','annual','hourly')),
  salary_is_public boolean NOT NULL DEFAULT false,
  schedule text,
  description text NOT NULL,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed','archived')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (salary_min_inr IS NULL OR salary_max_inr IS NULL OR salary_max_inr >= salary_min_inr)
);
CREATE INDEX IF NOT EXISTS jobs_public_idx ON jobs (status,published_at DESC) WHERE status='published';
CREATE INDEX IF NOT EXISTS jobs_industry_idx ON jobs (industry_slug,status);

CREATE TABLE IF NOT EXISTS employer_enquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_name text NOT NULL,
 contact_name text NOT NULL,
 contact_email text NOT NULL,
 phone text NOT NULL,
 industry_slug text NOT NULL,
 work_location text NOT NULL,
 headcount integer NOT NULL CHECK (headcount > 0),
 payroll_preference text NOT NULL CHECK (payroll_preference IN ('arms','client','undecided')),
 role_requirements text NOT NULL,
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal','won','closed')),
 consent_notice_version text NOT NULL,
 consent_received_at timestamptz NOT NULL,
 assigned_admin_id text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employer_enquiries_created_idx ON employer_enquiries(created_at DESC);

CREATE TABLE IF NOT EXISTS candidates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 full_name text NOT NULL,
 phone text NOT NULL,
 email text,
 current_location text NOT NULL,
 preferred_industry_slug text,
 preferred_role text,
 experience_text text,
 privacy_notice_version text NOT NULL,
 consent_received_at timestamptz NOT NULL,
 talent_network_opt_in boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS candidates_created_idx ON candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS candidates_phone_idx ON candidates(phone);

CREATE TABLE IF NOT EXISTS private_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
 storage_key text UNIQUE NOT NULL,
 original_filename text NOT NULL,
 mime_type text NOT NULL,
 size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
 scan_status text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','clean','rejected')),
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
 candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
 document_id uuid REFERENCES private_documents(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewing','shortlisted','interview','hired','not_selected','withdrawn')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (job_id,candidate_id)
);
CREATE INDEX IF NOT EXISTS applications_job_idx ON job_applications(job_id,created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id text NOT NULL,
 action text NOT NULL,
 object_type text NOT NULL,
 object_id uuid,
 safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON admin_audit_events(created_at DESC);

-- Migration implementation: set policies using your selected provider, default no anonymous table access.
-- Do NOT GRANT public SELECT or INSERT to sensitive candidate/application/document tables.
