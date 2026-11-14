import fs from "node:fs";
const required=["AGENTS.md","CODEX_START_HERE.md","README.md","app/page.tsx","app/layout.tsx","app/globals.css","app/jobs/page.tsx","app/talent-network/page.tsx","app/hire-workforce/page.tsx","content/site.ts","database/001_initial.sql", "public/brand/arms-wordmark.webp","public/brand/arms-symbol.webp",...Array.from({length:16},(_,i)=>`docs/${String(i+1).padStart(2,"0")}-${["PRODUCT-BRIEF","DESIGN-SYSTEM","SITEMAP-AND-PAGES","COPY-DECK","FORMS-AND-FLOWS","SECURITY-AND-DATA","IMPLEMENTATION-BACKLOG","PHOTOGRAPHY-BRIEF","SEO-ACCESSIBILITY","LAUNCH-CHECKLIST","ASSET-INVENTORY","DECISION-LOG","API-CONTRACTS","ADMIN-UX","OWNER-INPUTS","GENERATED-IMAGERY"][i]}.md`)];
const missing=required.filter(p=>!fs.existsSync(p));
const refs=fs.readdirSync("references").filter(f=>f.endsWith(".png"));
if(refs.length!==7)missing.push(`Expected 7 reference PNGs, found ${refs.length}`);
if(missing.length){console.error("Handoff incomplete:",missing);process.exit(1)}
console.log(`Handoff structure valid: ${required.length} required paths and ${refs.length} brand references present.`);
