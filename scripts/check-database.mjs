import nextEnv from "@next/env";
import {Client} from "pg";
import {databaseConfig,databaseErrorCode} from "./lib/database-config.mjs";

// Environment values, raw database errors and applicant records never reach stdout.
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
let client;
try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_MISSING");
  const tunnel=process.argv.includes("--ssh-tunnel");
  const url=new URL(process.env.DATABASE_URL);
  if(tunnel){
    url.hostname="127.0.0.1";url.port="15499";
    for(const key of [...url.searchParams.keys()]) if(key.startsWith("ssl")||key==="uselibpqcompat") url.searchParams.delete(key);
    url.searchParams.set("sslmode","disable");
  }
  client = new Client(databaseConfig(url.toString()));
  await client.connect();
  await client.query("BEGIN READ ONLY");
  const {rows:[role]} = await client.query("SELECT rolsuper,rolbypassrls,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user");
  const {rows:[connection]} = await client.query("SELECT current_setting('server_version_num') AS version, (SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS encrypted");
  const names=["jobs","employer_enquiries","candidates","private_documents","job_applications","admin_audit_events"];
  const {rows} = await client.query("SELECT name, to_regclass('public.' || name) IS NOT NULL AS present FROM unnest($1::text[]) AS name",[names]);
  await client.query("ROLLBACK");
  console.log(JSON.stringify({connected:true,connectionMode:tunnel?"local-ssh-forward":"direct",postgresMajor:Math.floor(Number(connection.version)/10000),postgresTls:connection.encrypted,privilegedRole:Object.values(role).some(Boolean),initialTablesPresent:rows.filter(row=>row.present).length,initialTablesExpected:names.length,readOnly:true,storageLocationConfigured:Boolean(process.env.AWS_REGION&&process.env.S3_PRIVATE_CV_BUCKET),staffAuthEnabled:process.env.STAFF_AUTH_ENABLED==="true",staffRuntimeConfigured:Boolean(process.env.STAFF_DATABASE_URL),sesSenderConfigured:Boolean(process.env.SES_REGION&&process.env.SES_FROM_EMAIL)},null,2));
} catch (error) {
  const code=databaseErrorCode(error);
  console.error(JSON.stringify({connected:false,code,message:"Database check failed. No migration or applicant-data query was executed."}));
  process.exitCode=1;
} finally {
  await client?.end().catch(()=>{});
}
