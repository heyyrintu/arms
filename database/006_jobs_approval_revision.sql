-- PostgreSQL CHECK permits NULL results; require this publication invariant explicitly.
-- Do not edit the already-applied 004 migration.
ALTER TABLE arms_jobs.jobs ADD CONSTRAINT jobs_published_revision_required
  CHECK(status<>'published' OR approved_revision IS NOT NULL);
