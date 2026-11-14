// Include memberships that permit SET ROLE even when NOINHERIT is configured,
// and column grants that a table-level privilege check alone would miss.
export const staffRuntimePermissionQuery=`SELECT
  EXISTS (SELECT 1 FROM pg_roles r WHERE pg_has_role(r.oid,'MEMBER')
    AND (r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole)) AS elevated,
  EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='arms_auth' AND pg_has_role(c.relowner,'MEMBER')) AS owns_tables,
  has_schema_privilege('arms_auth','CREATE') AS can_create,
  (has_table_privilege('arms_auth.staff_users','INSERT,UPDATE,DELETE,TRUNCATE')
    OR has_any_column_privilege('arms_auth.staff_users','INSERT,UPDATE')) AS can_change_staff`;
