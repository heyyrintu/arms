// Explicit black-box checks of the named synthetic environment only.
// No real personal data, session secrets or response bodies are logged.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const env=Object.fromEntries((await readFile(new URL('../.env.staging-access',import.meta.url),'utf8')).trim().split('\n').map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
const args=process.argv.slice(2);
assert.ok(args.length===0||(args.length===2&&args[0]==='--origin'),'Use --origin with the exact approved ARMS origin');
const origin=args.length?args[1]:env.APP_BASE_URL;
assert.ok(['https://arms-staging.dronalogitech.com','https://armstalentpartners.com'].includes(origin),'Use the named ARMS private deployment only');
const request=(path,options={})=>fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(15000),...options});
let checks=0;
function check(actual,expected,label){assert.equal(actual,expected,label);console.log('PASS '+label);checks++;}
check((await request('/admin/staging')).status,401,'no staging cookie denies access');
const unlocked=await request('/api/staging/unlock',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:env.STAGING_GATE_PASSWORD})});
check(unlocked.status,303,'existing staging password unlocks through the actual route');
const cookie=unlocked.headers.getSetCookie().find(value=>value.startsWith('__Host-arms_stage_gate='))?.split(';')[0];assert.ok(cookie);
const headers={Cookie:cookie,Origin:origin,'Content-Type':'application/json'};
for(const path of ['/api/employer-enquiries','/api/talent-registrations','/api/job-applications'])check((await request(path,{method:'POST',headers,body:'{}'})).status,503,'real collection remains unavailable: '+path);
const jobs=await request('/api/jobs',{headers});check(jobs.status,200,'public jobs endpoint is available');assert.deepEqual(await jobs.json(),{items:[]});checks++;console.log('PASS no synthetic job in public feed');
check((await request('/api/staff/staging',{method:'POST',headers,body:'{}'})).status,403,'gate alone cannot authorize staff writes');
const admin=await request('/admin/staging',{headers});check(admin.status,307,'gate alone cannot authorize staff workspace');assert.equal(admin.headers.get('location'),'/admin/sign-in');
check((await request('/api/staging/unlock',{method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:'not-a-secret'})})).status,403,'cross-origin unlock is refused');
console.log('Completed '+checks+' hosted checks. No applicant records created by this script.');
