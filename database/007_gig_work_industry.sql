-- Owner added Gig Work as the fourth supported industry. Preserve applied files.
DO $$
DECLARE constraint_name text; matches integer:=0;
BEGIN
  FOR constraint_name IN SELECT conname FROM pg_constraint
    WHERE conrelid='arms_jobs.jobs'::regclass AND contype='c'
    AND pg_get_constraintdef(oid) LIKE '%industrySlug%'
    AND pg_get_constraintdef(oid) LIKE '%warehousing-fulfillment%'
  LOOP
    matches:=matches+1;
    EXECUTE format('ALTER TABLE arms_jobs.jobs DROP CONSTRAINT %I',constraint_name);
  END LOOP;
  IF matches<>1 THEN RAISE EXCEPTION 'unexpected industry constraint count'; END IF;
END $$;
ALTER TABLE arms_jobs.jobs ADD CONSTRAINT jobs_supported_industry
  CHECK(posting->>'industrySlug' IN ('warehousing-fulfillment','transportation-drivers','cafes-hospitality','gig-work','other'));
