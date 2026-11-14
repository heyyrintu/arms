-- Isolated jobs schema. No applicant tables, fixtures or public writes.
CREATE SCHEMA arms_jobs;
REVOKE ALL ON SCHEMA arms_jobs FROM PUBLIC;
CREATE TABLE arms_jobs.jobs (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL CHECK (length(slug) BETWEEN 1 AND 100 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  posting jsonb NOT NULL CHECK (jsonb_typeof(posting)='object' AND octet_length(posting::text)<=32768),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed','archived')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
  created_by uuid NOT NULL REFERENCES arms_auth.staff_users(id),
  approved_by uuid REFERENCES arms_auth.staff_users(id),
  approval_reference text CHECK (approval_reference IS NULL OR length(approval_reference) BETWEEN 10 AND 500),
  approved_revision integer,
  approved_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (posting->>'slug'=slug),
  CHECK (posting ?& ARRAY['title','slug','industrySlug','location','employmentType','employer','payrollModel','experience','schedule','salaryIsPublic','salaryMin','salaryMax','salaryPeriod','description','responsibilities','requirements','expiresOn']),
  CHECK (NOT jsonb_path_exists(posting,'$.* ? (@.type() != "string")')),
  CHECK (length(posting->>'title') BETWEEN 1 AND 120),
  CHECK (length(posting->>'location') BETWEEN 1 AND 160 AND length(posting->>'description') BETWEEN 1 AND 5000),
  CHECK (length(posting->>'responsibilities') BETWEEN 1 AND 3000 AND length(posting->>'requirements') BETWEEN 1 AND 3000),
  CHECK (posting->>'industrySlug' IN ('warehousing-fulfillment','transportation-drivers','cafes-hospitality','other')),
  CHECK (posting->>'employmentType' IN ('Full-time','Part-time','Contract','Temporary')),
  CHECK (posting->>'payrollModel' IN ('arms','client','undecided')),
  CHECK (status<>'published' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND approved_revision=revision
    AND approval_reference IS NOT NULL AND published_at IS NOT NULL AND expires_at IS NOT NULL
    AND expires_at>published_at AND posting->>'payrollModel'<>'undecided'))
);
CREATE INDEX jobs_public_idx ON arms_jobs.jobs (published_at DESC,id) WHERE status='published';
CREATE TABLE arms_jobs.activity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES arms_jobs.jobs(id),
  actor_id uuid NOT NULL REFERENCES arms_auth.staff_users(id),
  action text NOT NULL CHECK(action IN ('created','saved','published','closed','archived','restored')),
  from_status text,
  to_status text NOT NULL,
  revision integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_job_idx ON arms_jobs.activity(job_id,id DESC);
CREATE TABLE arms_jobs.write_limits (
  actor_id uuid PRIMARY KEY REFERENCES arms_auth.staff_users(id),
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK(attempts>0)
);
-- Static qualified SQL only; callers cannot disable/replace this owner trigger.
CREATE FUNCTION arms_jobs.record_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid; action_name text;
BEGIN
  actor:=nullif(current_setting('arms.job_actor',true),'')::uuid;
  action_name:=nullif(current_setting('arms.job_action',true),'');
  IF actor IS NULL OR action_name IS NULL THEN RAISE EXCEPTION 'job actor required' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.id<>OLD.id OR NEW.created_by<>OLD.created_by OR NEW.created_at<>OLD.created_at OR NEW.revision<>OLD.revision+1 THEN
      RAISE EXCEPTION 'immutable job identity or revision' USING ERRCODE='23514';
    END IF;
    IF OLD.published_at IS NOT NULL AND NEW.slug<>OLD.slug THEN RAISE EXCEPTION 'published slug immutable' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.status='published' AND (NEW.approved_by<>actor OR NEW.expires_at<=statement_timestamp()) THEN
    RAISE EXCEPTION 'current approval and future expiry required' USING ERRCODE='23514';
  END IF;
  INSERT INTO arms_jobs.activity(job_id,actor_id,action,from_status,to_status,revision)
    VALUES(NEW.id,actor,action_name,CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END,NEW.status,NEW.revision);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION arms_jobs.record_change() FROM PUBLIC;
CREATE TRIGGER job_activity AFTER INSERT OR UPDATE ON arms_jobs.jobs FOR EACH ROW EXECUTE FUNCTION arms_jobs.record_change();
-- Reader gets this projection only. No approval references, actor IDs or drafts.
CREATE VIEW arms_jobs.public_jobs WITH (security_barrier=true) AS
  SELECT id,slug,posting->>'title' AS title,posting->>'industrySlug' AS industry_slug,
    posting->>'location' AS location,posting->>'employmentType' AS employment_type,
    posting->>'experience' AS experience,posting->>'schedule' AS schedule,
    posting->>'employer' AS employer,posting->>'payrollModel' AS payroll_model,
    CASE WHEN posting->>'salaryIsPublic'='yes' THEN posting->>'salaryMin' ELSE NULL END AS salary_min,
    CASE WHEN posting->>'salaryIsPublic'='yes' THEN posting->>'salaryMax' ELSE NULL END AS salary_max,
    CASE WHEN posting->>'salaryIsPublic'='yes' THEN posting->>'salaryPeriod' ELSE NULL END AS salary_period,
    posting->>'description' AS description,posting->>'responsibilities' AS responsibilities,
    posting->>'requirements' AS requirements,published_at,expires_at
  FROM arms_jobs.jobs WHERE status='published' AND approved_by IS NOT NULL AND approved_revision=revision
    AND approved_at IS NOT NULL AND expires_at>statement_timestamp();
REVOKE ALL ON ALL TABLES IN SCHEMA arms_jobs FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA arms_jobs FROM PUBLIC;
CREATE TABLE arms_jobs.schema_migrations(name text PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now());
