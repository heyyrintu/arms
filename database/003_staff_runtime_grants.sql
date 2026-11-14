-- Operator review required. Create arms_staff_runtime with a unique secret via
-- the secret manager first; it must NOT own the schema, inherit owner roles,
-- be superuser/BYPASSRLS, or have CREATE/CREATEROLE/CREATEDB rights.
GRANT USAGE ON SCHEMA arms_auth TO arms_staff_runtime;
GRANT SELECT ON arms_auth.staff_users TO arms_staff_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON arms_auth.login_limits, arms_auth.login_challenges, arms_auth.staff_sessions TO arms_staff_runtime;
GRANT INSERT ON arms_auth.security_events TO arms_staff_runtime;
GRANT USAGE ON SEQUENCE arms_auth.security_events_id_seq TO arms_staff_runtime;
-- Runtime cannot create/change staff, password hashes, roles or activity flags.
-- Staff administration is an operator-only procedure until audited workflows exist.
