import assert from "node:assert/strict";
import {test} from "node:test";
import {databaseConfig,databaseErrorCode} from "../scripts/lib/database-config.mjs";

test("remote URL parameters cannot weaken TLS certificate validation",()=>{
  for(const options of ["sslmode=require","sslmode=no-verify","sslmode=disable","ssl=true&uselibpqcompat=true"]){
    const config=databaseConfig(`postgresql://test:fixture@database.invalid/test?${options}`);
    assert.equal(config.ssl.rejectUnauthorized,true);
    assert.equal(new URL(config.connectionString).search,"");
  }
});
test("plain connections are limited to local development",()=>{
  assert.equal(databaseConfig("postgresql://test@localhost/test").ssl,false);
  assert.equal(databaseConfig("postgresql://test@127.0.0.1/test?sslmode=disable").ssl,false);
  assert.equal(databaseConfig("postgresql://test@localhost/test?sslmode=require").ssl.rejectUnauthorized,true);
  assert.throws(()=>databaseConfig("https://example.invalid/test"),/INVALID_DATABASE_URL/);
});
test("diagnostic errors redact arbitrary messages and identify common failures",()=>{
  assert.equal(databaseErrorCode(new Error("postgresql://test:fixture@database.invalid/test")),"CONNECTION_CHECK_FAILED");
  assert.equal(databaseErrorCode(new Error("Connection terminated due to connection timeout")),"CONNECTION_TIMEOUT");
  assert.equal(databaseErrorCode({code:"28P01",message:"sensitive detail"}),"28P01");
  assert.equal(databaseErrorCode({cause:{code:"ECONNREFUSED"}}),"ECONNREFUSED");
});
