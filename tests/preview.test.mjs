import assert from "node:assert/strict";
import { test } from "node:test";

const base = new URL(process.env.ARMS_TEST_URL || "http://127.0.0.1:3000");
// Never allow this fixture-only suite to send even empty POSTs to a public site.
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Use a local preview server");
const demo = process.env.ARMS_TEST_DEMO === "true";
const industries = ["warehousing-fulfillment", "transportation-drivers", "cafes-hospitality"];
const solutions = ["build-your-workforce", "manage-your-workforce", "support-your-workforce"];
const samples = ["sample-warehouse-associate", "sample-delivery-driver", "sample-cafe-associate"];
const routes = ["/", "/about", "/solutions", "/industries", "/jobs", "/hire-workforce", "/talent-network", "/contact", "/candidate-support", "/privacy", ...industries.map(s => `/industries/${s}`), ...solutions.map(s => `/solutions/${s}`)];
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
  for (const route of ["/hire-workforce", "/talent-network"]) {
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


test("staff routes fail closed and expose no account or applicant data before setup", async () => {
  const admin=await fetch(new URL('/admin',base),{redirect:'manual'});
  assert.equal(admin.status,307);
  assert.match(admin.headers.get('location'),/\/admin\/sign-in$/);
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
});
