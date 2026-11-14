-- PREPARED ONLY. Operator must provision separate non-owner logins, no memberships.
GRANT USAGE ON SCHEMA arms_intake TO arms_intake_submitter,arms_intake_reviewer;
GRANT SELECT(id,request_hash,payload_hash) ON arms_intake.records TO arms_intake_submitter;
GRANT INSERT(id,request_hash,payload_hash,kind,job_id,payload,notice_version,consent_at,future_roles_opt_in,purpose_delete_after,created_at,updated_at) ON arms_intake.records TO arms_intake_submitter;
GRANT SELECT,INSERT,UPDATE ON arms_intake.limits TO arms_intake_submitter;
GRANT INSERT ON arms_intake.outbox TO arms_intake_submitter;
-- Retry hashes only; the submitter cannot read saved personal data.
-- Never expose either login to public clients.
-- FOR SHARE requires UPDATE on at least one column. A locked-down owner function
-- instead locks and verifies the job without granting any job write privilege.
CREATE FUNCTION arms_intake.lock_open_job(target uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE found_id uuid;
BEGIN
 SELECT id INTO found_id FROM arms_jobs.jobs WHERE id=target AND status='published' AND approved_by IS NOT NULL
  AND approved_revision=revision AND approved_at IS NOT NULL AND expires_at>statement_timestamp() FOR SHARE;
 RETURN found_id IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION arms_intake.lock_open_job(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arms_intake.lock_open_job(uuid) TO arms_intake_submitter;
GRANT SELECT(id,kind,job_id,payload,notice_version,consent_at,future_roles_opt_in,status,revision,application_ended_at,application_delete_after,purpose_delete_after,created_at,updated_at) ON arms_intake.records TO arms_intake_reviewer;
GRANT UPDATE(status,revision,application_ended_at,application_delete_after,updated_at) ON arms_intake.records TO arms_intake_reviewer;
GRANT EXECUTE ON FUNCTION arms_intake.record_view(uuid,uuid) TO arms_intake_reviewer;
-- No audit changes, DELETE/TRUNCATE/DDL, credential access, job updates or CV access.
