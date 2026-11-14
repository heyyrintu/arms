import {readFileSync} from "node:fs";

export function databaseErrorCode(error) {
  const known=["ENOTFOUND","EAI_AGAIN","ECONNREFUSED","ETIMEDOUT","ECONNRESET","ENETUNREACH","EHOSTUNREACH","28P01","28000","3D000","42501","ERR_INVALID_URL","CERT_HAS_EXPIRED","SELF_SIGNED_CERT_IN_CHAIN","DEPTH_ZERO_SELF_SIGNED_CERT","UNABLE_TO_VERIFY_LEAF_SIGNATURE","UNABLE_TO_GET_ISSUER_CERT_LOCALLY","ERR_TLS_CERT_ALTNAME_INVALID"];
  const code=error?.code ?? error?.cause?.code;
  if(known.includes(code)) return code;
  const message=String(error?.message ?? "");
  if(["DATABASE_URL_MISSING","INVALID_DATABASE_URL"].includes(message)) return message;
  if(/timeout|timed out/i.test(message)) return "CONNECTION_TIMEOUT";
  if(/does not support SSL/i.test(message)) return "SERVER_TLS_UNAVAILABLE";
  if(/certificate/i.test(message)) return "TLS_VERIFICATION_FAILED";
  return "CONNECTION_CHECK_FAILED";
}

// CLI/server tooling only. Never import this module into a client component.
export function databaseConfig(connectionString) {
  const url = new URL(connectionString);
  if (!["postgres:","postgresql:"].includes(url.protocol)) throw new Error("INVALID_DATABASE_URL");
  const local = ["localhost","127.0.0.1","[::1]"].includes(url.hostname);
  const mode = url.searchParams.get("sslmode");
  const ssl = {rejectUnauthorized:true};
  for (const [parameter,field] of [["sslrootcert","ca"],["sslcert","cert"],["sslkey","key"]]) {
    const path = url.searchParams.get(parameter);
    if (path) ssl[field] = readFileSync(path,"utf8");
  }
  // pg URL TLS parameters replace explicit TLS settings. Strip them before
  // passing the URL so a supplied sslmode cannot disable certificate checking.
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("ssl") || key === "uselibpqcompat") url.searchParams.delete(key);
  }
  return {
    connectionString:url.toString(),
    ssl:local && (!mode || mode === "disable") ? false : ssl,
    connectionTimeoutMillis:5000,
    statement_timeout:3000,
    query_timeout:5000,
    application_name:"arms-readonly-diagnostic",
  };
}
