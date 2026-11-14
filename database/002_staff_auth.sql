-- Reviewed independently of 001_initial.sql. Not applied automatically.
-- Run as a migration owner in approved staging, never as the runtime login.
CREATE SCHEMA arms_auth;
REVOKE ALL ON SCHEMA arms_auth FROM PUBLIC;
CREATE TABLE arms_auth.staff_users (
  id uuid PRIMARY KEY,
  login_id text UNIQUE NOT NULL CHECK (login_id ~ '^[a-z0-9][a-z0-9._@+-]{2,79}$'),
  email text NOT NULL CHECK (length(email) <= 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  password_hash text NOT NULL CHECK (password_hash LIKE 'scrypt$131072$8$1$%'),
  role text NOT NULL CHECK (role IN ('admin','recruiter','business_development')),
  active boolean NOT NULL DEFAULT true,
  auth_version integer NOT NULL DEFAULT 1 CHECK (auth_version > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE arms_auth.login_limits (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0)
);
CREATE TABLE arms_auth.login_challenges (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid UNIQUE NOT NULL REFERENCES arms_auth.staff_users(id) ON DELETE CASCADE,
  auth_version integer NOT NULL,
  code_hash text NOT NULL CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  delivered_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX staff_challenges_user_idx ON arms_auth.login_challenges(user_id);
CREATE TABLE arms_auth.staff_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid NOT NULL REFERENCES arms_auth.staff_users(id) ON DELETE CASCADE,
  auth_version integer NOT NULL,
  email_verified_at timestamptz,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX staff_sessions_user_idx ON arms_auth.staff_sessions(user_id);
CREATE TABLE arms_auth.security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES arms_auth.staff_users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('password_accepted','login_rejected','email_failed','signed_in','signed_out')),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON ALL TABLES IN SCHEMA arms_auth FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA arms_auth FROM PUBLIC;
-- Provision a dedicated LOGIN role separately, then use 003_staff_runtime_grants.sql.
-- No public/self-registration, default staff account, password or role is created.
