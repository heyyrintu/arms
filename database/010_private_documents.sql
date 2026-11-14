-- PREPARED ONLY, not applied to hosted storage. Requires 008/009.
CREATE TABLE arms_intake.documents (
 id uuid PRIMARY KEY,
 record_id uuid UNIQUE NOT NULL REFERENCES arms_intake.records(id),
 storage_key text UNIQUE NOT NULL CHECK(storage_key ~ '^quarantine/[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$'),
 sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
 size_bytes integer NOT NULL CHECK(size_bytes BETWEEN 1 AND 5242880),
 scan_status text NOT NULL DEFAULT 'pending' CHECK(scan_status IN ('pending','clean','rejected','failed')),
 scanned_at timestamptz,
 object_deleted_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((scan_status='pending')=(scanned_at IS NULL)),
 CHECK(scan_status<>'clean' OR object_deleted_at IS NULL)
);
CREATE INDEX document_cleanup_idx ON arms_intake.documents(created_at) WHERE scan_status<>'clean' AND object_deleted_at IS NULL;
CREATE TABLE arms_intake.document_access (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 document_id uuid NOT NULL REFERENCES arms_intake.documents(id),
 actor_id uuid NOT NULL REFERENCES arms_auth.staff_users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION arms_intake.record_document_access(target uuid,actor uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM arms_auth.staff_users WHERE id=actor AND active AND role='admin') THEN
  RAISE EXCEPTION 'document administrator required' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM arms_intake.documents d JOIN arms_intake.records r ON r.id=d.record_id WHERE d.id=target AND d.scan_status='clean' AND d.object_deleted_at IS NULL
  AND r.kind<>'employer' AND NOT(r.kind='talent' AND r.status='withdrawn')
  AND ((r.kind='application' AND r.application_ended_at IS NULL) OR greatest(r.application_delete_after,r.purpose_delete_after)>statement_timestamp())) THEN
  RAISE EXCEPTION 'document not available' USING ERRCODE='42501';
 END IF;
 INSERT INTO arms_intake.document_access(document_id,actor_id) VALUES(target,actor);
END $$;
REVOKE ALL ON FUNCTION arms_intake.record_document_access(uuid,uuid) FROM PUBLIC;
REVOKE ALL ON arms_intake.documents,arms_intake.document_access FROM PUBLIC;
REVOKE ALL ON SEQUENCE arms_intake.document_access_id_seq FROM PUBLIC;
GRANT SELECT ON arms_intake.documents TO arms_intake_reviewer;
GRANT EXECUTE ON FUNCTION arms_intake.record_document_access(uuid,uuid) TO arms_intake_reviewer;
-- Operator provisions this separate worker login. No staff credentials or PII reads.
GRANT USAGE ON SCHEMA arms_intake TO arms_cv_processor;
GRANT SELECT,INSERT ON arms_intake.documents TO arms_cv_processor;
GRANT UPDATE(scan_status,scanned_at,object_deleted_at) ON arms_intake.documents TO arms_cv_processor;
