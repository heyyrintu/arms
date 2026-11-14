-- PREPARED ONLY: reference-only staff notification delivery, no applicant mail.
ALTER TABLE arms_intake.outbox ADD COLUMN attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN lease_token uuid,
 ADD COLUMN lease_until timestamptz,
 ADD COLUMN sent_at timestamptz;
CREATE INDEX outbox_delivery_idx ON arms_intake.outbox(next_attempt_at) WHERE state<>'sent';
GRANT USAGE ON SCHEMA arms_intake TO arms_intake_notifier;
GRANT SELECT,UPDATE ON arms_intake.outbox TO arms_intake_notifier;
GRANT SELECT(id,kind) ON arms_intake.records TO arms_intake_notifier;
-- No payload/contact/document/staff reads and no broad table deletion.
