export const reviewPermissionQuery=`SELECT current_user AS name,
   EXISTS(SELECT 1 FROM pg_roles r WHERE pg_has_role(r.oid,'MEMBER') AND (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb)) AS elevated,
   EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('arms_auth','arms_jobs','arms_intake') AND pg_has_role(c.relowner,'MEMBER')) AS owner,
   has_schema_privilege('arms_intake','CREATE') AS can_create,
   EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='arms_auth' AND (has_table_privilege(c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') OR has_any_column_privilege(c.oid,'SELECT,INSERT,UPDATE'))) AS auth_access,
   EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='arms_jobs' AND c.relname='jobs' AND has_any_column_privilege(c.oid,'INSERT,UPDATE')) AS jobs_write,
   (has_table_privilege('arms_intake.records','INSERT,DELETE,TRUNCATE') OR has_column_privilege('arms_intake.records','payload','UPDATE') OR has_column_privilege('arms_intake.records','request_hash','SELECT')) AS unsafe_records,
   EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='arms_intake' AND c.relname IN ('activity','document_access') AND (has_table_privilege(c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') OR has_any_column_privilege(c.oid,'INSERT,UPDATE'))) AS audit_write,
   (has_table_privilege('arms_intake.documents','INSERT,UPDATE,DELETE,TRUNCATE') OR has_any_column_privilege('arms_intake.documents','INSERT,UPDATE')) AS documents_write`;
export function assertReviewPermissions(safety) {
 if(!safety||safety.name!=='arms_intake_reviewer'||Object.entries(safety).some(([key,value])=>key!=='name'&&value))throw new Error('INTAKE_ROLE_UNSAFE');
}
