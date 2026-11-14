import assert from "node:assert/strict";
import { test } from "node:test";

const base = new URL(process.env.ARMS_TEST_URL || "http://127.0.0.1:3000");
// Never allow this fixture-only suite to send even empty POSTs to a public site.
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Use a local preview server");
const demo = process.env.ARMS_TEST_DEMO === "true";
const industries = ["warehousing-fulfillment", "transportation-drivers", "cafes-hospitality","gig-work"];
const solutions = ["build-your-workforce", "manage-your-workforce", "support-your-workforce"];
const samples = ["sample-warehouse-associate", "sample-delivery-driver", "sample-cafe-associate"];
const routes = ["/", "/about", "/solutions", "/industries", "/jobs", "/hire-workforce", "/career", "/contact", "/candidate-support", "/privacy", ...industries.map(s => `/industries/${s}`), ...solutions.map(s => `/solutions/${s}`)];
const pages = new Map();

test("every primary public route renders with one h1 and remains no-index", async () => {
  for (const route of routes) {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 200, route);
    const html = await response.text();
    pages.set(route, html);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, route);
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/, route);
  }
});

test("all internal navigation links point to working routes", async () => {
  const targets = new Set();
  for (const html of pages.values()) {
    for (const match of html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)/g)) targets.add(match[1]);
  }
  assert.ok(targets.size >= routes.length);
  for (const target of targets) {
    if (pages.has(target)) continue;
    assert.equal((await fetch(new URL(target, base))).status, 200, target);
  }
});

test("both audience forms are inert without relying on JavaScript", () => {
  for (const route of ["/hire-workforce", "/career"]) {
    const html = pages.get(route);
    assert.match(html, /<fieldset disabled=""/, route);
    assert.match(html, /Submissions are not open yet/, route);
    assert.doesNotMatch(html, /<form\b/, route);
    assert.doesNotMatch(html, /type="submit"/, route);
  }
});

test("all submission APIs fail closed and never acknowledge storage", async () => {
  for (const name of ["employer-enquiries", "talent-registrations", "job-applications"]) {
    const response = await fetch(new URL(`/api/${name}`, base), { method: "POST" });
    assert.equal(response.status, 503, name);
    assert.match(response.headers.get("cache-control"), /no-store/, name);
    const body = await response.json();
    assert.ok(body.error, name);
    assert.equal(body.referenceId, undefined, name);
  }
});

test("fictional jobs are labelled and inert in development, unavailable in production", async () => {
  for (const slug of samples) {
    const response = await fetch(new URL(`/jobs/${slug}`, base));
    const html = await response.text();
    assert.equal(response.status, demo ? 200 : 404, slug);
    if (demo) {
      assert.match(html, /Not an active job/, slug);
      assert.doesNotMatch(html, /<form\b/, slug);
      assert.match(html, /noindex/, slug);
    }
  }
  const jobs = pages.get("/jobs");
  assert.match(jobs, demo ? /fictional samples/ : /No verified live vacancies have been published yet/);
  if (!demo) assert.doesNotMatch(jobs, /href="\/jobs\/sample-/);
});

test("preview robots prevent crawling and unknown pages return 404", async () => {
  assert.match(await (await fetch(new URL("/robots.txt", base))).text(), /Disallow: \//);
  for (const route of ["/not-a-real-page", "/industries/not-a-sector", "/solutions/not-a-service", "/jobs/not-a-vacancy"]) {
    assert.equal((await fetch(new URL(route, base))).status, 404, route);
  }
});

test('Hindi server output covers public routes, with four industries, Career and privacy gates',async()=>{
  for(const route of [...routes,'/admin/sign-in']) {
    const response=await fetch(new URL(route,base),{headers:{Cookie:'arms_language=hi'}});
    assert.equal(response.status,200,route);
    const html=await response.text();
    assert.match(html,/<html[^>]*lang="hi"/,route);
    const heading=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1];
    assert.match(heading??'',/[\u0900-\u097f]/,route);
    assert.match(html,/href="\/career"/,route);
    assert.match(response.headers.get('cache-control')??'',/no-store|private/,route);
    if(['/career','/hire-workforce'].includes(route)){assert.match(html,/<fieldset disabled=""/);assert.doesNotMatch(html,/<form\b/);}
    if(route==='/privacy'){assert.match(html,/2026-11-14.v2/);assert.match(html,/गोपनीयता/);assert.match(html,/24 महीने/);}
  }
  const legacy=await fetch(new URL('/talent-network',base),{redirect:'manual'});assert.equal(legacy.status,308);assert.equal(legacy.headers.get('location'),'/career');
});

test('language preference accepts only bounded same-origin English/Hindi requests',async()=>{
  const endpoint=new URL('/api/language',base);
  for(const locale of ['hi','en']) {
    const response=await fetch(endpoint,{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/json'},body:JSON.stringify({locale})});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{locale});
    const cookie=response.headers.get('set-cookie');assert.match(cookie,new RegExp(`arms_language=${locale}`));assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=lax/i);
    assert.doesNotMatch(cookie,/arms_staff|arms_challenge/);
  }
  for(const body of [{locale:'fr'},{locale:'hi',extra:true}])assert.equal((await fetch(endpoint,{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/json'},body:JSON.stringify(body)})).status,400);
  assert.equal((await fetch(endpoint,{method:'POST',headers:{Origin:'https://unrelated.example.invalid','Content-Type':'application/json'},body:'{"locale":"hi"}'})).status,403);
  assert.equal((await fetch(endpoint,{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/json'},body:'x'.repeat(65)})).status,413);
});


test("staff routes fail closed and expose no account or applicant data before setup", async () => {
  for(const path of ['/admin/intake/employer','/admin/intake/talent','/admin/intake/application','/admin/records/00000000-0000-4000-8000-000000000001','/admin','/admin/jobs','/admin/jobs/new','/admin/jobs/00000000-0000-4000-8000-000000000001']) {
    const admin=await fetch(new URL(path,base),{redirect:'manual'});
    assert.equal(admin.status,307,path);
    assert.match(admin.headers.get('location'),/\/admin\/sign-in$/,path);
    assert.match(admin.headers.get('x-robots-tag'),/noindex/,path);
    assert.match(admin.headers.get('cache-control'),/no-store/,path);
    assert.doesNotMatch(await admin.text(),/id="title"|id="salaryMin"/,path);
  }
  const signIn=await fetch(new URL('/admin/sign-in',base));
  const html=await signIn.text();
  assert.equal(signIn.status,200);
  assert.equal((html.match(/<main[\s>]/g)||[]).length,1);
  assert.match(html,/Staff sign-in is not available yet/);
  assert.doesNotMatch(html,/<input[^>]*name="password"/);
  assert.match(signIn.headers.get('x-robots-tag'),/noindex/);
  assert.match(signIn.headers.get('cache-control'),/no-store/);
  for(const action of ['login','verify','logout']) {
    const result=await fetch(new URL(`/api/staff/${action}`,base),{method:'POST'});
    assert.equal(result.status,503);
    assert.match(result.headers.get('cache-control'),/no-store/);
    assert.equal(result.headers.get('set-cookie'),null);
    assert.deepEqual(Object.keys(await result.json()),['error']);
  }
  const mutation=await fetch(new URL('/api/staff/jobs/00000000-0000-4000-8000-000000000001',base),{method:'POST'});
  assert.equal(mutation.status,503);
  assert.match(mutation.headers.get('cache-control'),/no-store/);
});

test('public jobs API contains no demos, approval records or private staff data',async()=>{
  const response=await fetch(new URL('/api/jobs',base));
  assert.equal(response.status,200);
  assert.match(response.headers.get('cache-control'),/no-store/);
  const body=await response.json();assert.ok(Array.isArray(body.items));
  for(const job of body.items) {
    assert.equal(job.isSample,false);
    for(const field of ['posting','created_by','approved_by','approval_reference','password_hash','actor_id'])assert.equal(job[field],undefined);
  }
});


test('private intake and document mutations fail closed without returning personal data',async()=>{
 for(const path of ['/api/staff/intake/00000000-0000-4000-8000-000000000001','/api/staff/documents/00000000-0000-4000-8000-000000000001/download']) {
  for(const headers of [{},{Origin:'https://unrelated.example.invalid'}]) {
   const result=await fetch(new URL(path,base),{method:'POST',headers});assert.equal(result.status,503,path);assert.match(result.headers.get('cache-control'),/no-store/);assert.equal(result.headers.get('set-cookie'),null);assert.deepEqual(Object.keys(await result.json()),['error']);
  }
  const get=await fetch(new URL(path,base));assert.equal(get.status,405,path);
 }
});

test('synthetic staging routes are unavailable outside the explicit isolated environment',async()=>{
 for(const path of ['/staging/unlock','/staging/mailbox','/admin/staging'])assert.equal((await fetch(new URL(path,base))).status,404,path);
 for(const path of ['/api/staging/unlock','/api/staff/staging']){
  const result=await fetch(new URL(path,base),{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/json'},body:'{}'});
  assert.equal(result.status,404,path);
 }
});
