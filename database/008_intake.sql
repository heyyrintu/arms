-- PREPARED ONLY: isolated personal-data foundation. Do not apply/enable until reviewed.
-- Requires arms_auth and arms_jobs. No data, login, public grants or network changes.
CREATE SCHEMA arms_intake;
REVOKE ALL ON SCHEMA arms_intake FROM PUBLIC;
CREATE TABLE arms_intake.records (
 id uuid PRIMARY KEY,
 request_hash text UNIQUE NOT NULL CHECK(request_hash ~ '^[0-9a-f]{64}$'),
 payload_hash text NOT NULL CHECK(payload_hash ~ '^[0-9a-f]{64}$'),
 kind text NOT NULL CHECK(kind IN ('employer','talent','application')),
 job_id uuid REFERENCES arms_jobs.jobs(id) ON DELETE RESTRICT,
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object' AND octet_length(payload::text)<=16384),
 notice_version text NOT NULL CHECK(length(notice_version) BETWEEN 1 AND 80),
 consent_at timestamptz NOT NULL DEFAULT now(),
 future_roles_opt_in boolean NOT NULL,
 status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','reviewing','contacted','qualified','proposal','won','closed','shortlisted','interview','hired','not_selected','withdrawn')),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 application_ended_at timestamptz,
 application_delete_after timestamptz,
 purpose_delete_after timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((kind='application')=(job_id IS NOT NULL)),
 CHECK(kind<>'employer' OR future_roles_opt_in=false),
 CHECK(kind<>'talent' OR future_roles_opt_in=true),
 CHECK((application_ended_at IS NULL)=(application_delete_after IS NULL)),
 CHECK(application_ended_at IS NULL OR kind='application'),
 CHECK(application_delete_after IS NULL OR application_delete_after>application_ended_at),
 CHECK((purpose_delete_after IS NOT NULL)=(kind<>'application' OR future_roles_opt_in)),
 CHECK(purpose_delete_after IS NULL OR purpose_delete_after>created_at),
 CHECK(length(payload->>'name') BETWEEN 1 AND 120 AND length(payload->>'phone') BETWEEN 9 AND 16),
 CHECK(payload ?& ARRAY['name','email','phone','location']),
 CHECK(status NOT IN ('closed','hired','not_selected','withdrawn') OR kind<>'application' OR application_ended_at IS NOT NULL)
);
CREATE INDEX intake_recent_idx ON arms_intake.records(kind,created_at DESC,id);
CREATE INDEX intake_application_retention_idx ON arms_intake.records(application_delete_after) WHERE application_delete_after IS NOT NULL;
CREATE INDEX intake_purpose_retention_idx ON arms_intake.records(purpose_delete_after) WHERE purpose_delete_after IS NOT NULL;
CREATE TABLE arms_intake.limits (
 key_hash text PRIMARY KEY CHECK(key_hash ~ '^[0-9a-f]{64}$'),
 window_started_at timestamptz NOT NULL,
 attempts integer NOT NULL CHECK(attempts>0)
);
CREATE TABLE arms_intake.activity (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 record_id uuid NOT NULL REFERENCES arms_intake.records(id),
 actor_id uuid REFERENCES arms_auth.staff_users(id),
 action text NOT NULL CHECK(action IN ('received','viewed','status_changed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE arms_intake.outbox (
 id uuid PRIMARY KEY,
 record_id uuid UNIQUE NOT NULL REFERENCES arms_intake.records(id),
 -- Reference only: no applicant names, email addresses or body snapshots in queue.
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sent','failed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION arms_intake.record_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;
BEGIN
 IF TG_OP='UPDATE' THEN
  actor:=nullif(current_setting('arms.intake_actor',true),'')::uuid;
  IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM arms_auth.staff_users WHERE id=actor AND active AND role='admin') THEN
   RAISE EXCEPTION 'intake administrator required' USING ERRCODE='42501';
  END IF;
  IF NEW.id<>OLD.id OR NEW.kind<>OLD.kind OR NEW.payload<>OLD.payload OR NEW.request_hash<>OLD.request_hash OR NEW.payload_hash<>OLD.payload_hash
   OR NEW.notice_version<>OLD.notice_version OR NEW.consent_at<>OLD.consent_at OR NEW.future_roles_opt_in<>OLD.future_roles_opt_in
   OR NEW.job_id IS DISTINCT FROM OLD.job_id OR NEW.created_at<>OLD.created_at OR NEW.revision<>OLD.revision+1
   OR (OLD.application_ended_at IS NOT NULL AND (NEW.application_ended_at IS DISTINCT FROM OLD.application_ended_at OR NEW.application_delete_after IS DISTINCT FROM OLD.application_delete_after))
   OR NEW.purpose_delete_after IS DISTINCT FROM OLD.purpose_delete_after THEN
   RAISE EXCEPTION 'immutable intake identity, purpose or retention' USING ERRCODE='23514';
  END IF;
 END IF;
 INSERT INTO arms_intake.activity(record_id,actor_id,action) VALUES(NEW.id,actor,CASE WHEN TG_OP='INSERT' THEN 'received' ELSE 'status_changed' END);
 RETURN NEW;
END $$;
CREATE TRIGGER intake_change AFTER INSERT OR UPDATE ON arms_intake.records FOR EACH ROW EXECUTE FUNCTION arms_intake.record_change();
CREATE FUNCTION arms_intake.record_view(target uuid,actor uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM arms_auth.staff_users WHERE id=actor AND active AND role='admin') THEN
  RAISE EXCEPTION 'intake administrator required' USING ERRCODE='42501';
 END IF;
 INSERT INTO arms_intake.activity(record_id,actor_id,action) VALUES(target,actor,'viewed');
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA arms_intake FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA arms_intake FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA arms_intake FROM PUBLIC;
