-- These logins are provisioned by the operator, never by a web request.
GRANT USAGE ON SCHEMA arms_jobs TO arms_jobs_runtime,arms_jobs_reader;
GRANT SELECT,INSERT,UPDATE ON arms_jobs.jobs,arms_jobs.write_limits TO arms_jobs_runtime;
GRANT SELECT ON arms_jobs.activity TO arms_jobs_runtime;
GRANT SELECT ON arms_jobs.public_jobs TO arms_jobs_reader;
-- No DELETE/TRUNCATE/DDL, staff credentials, applicant schema or audit mutation.
