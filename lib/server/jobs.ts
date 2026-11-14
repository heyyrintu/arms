import 'server-only';
import {Pool} from 'pg';
import {cookies} from 'next/headers';
import {databaseConfig} from '@/scripts/lib/database-config.mjs';
import {getStaffAuth,staffCookie} from './staff';
import {jobsService} from '@/lib/jobs-service.mjs';
import {jobPostingLines,salaryPeriods} from '@/lib/job-posting.mjs';
import {type Job,isDemo,sampleJobs} from '@/content/site';

let adminPool:Pool|undefined;
let publicPool:Pool|undefined;
const checked=new WeakSet<Pool>();
export const jobsReady=()=>process.env.JOBS_ENABLED==='true'&&!!process.env.JOBS_DATABASE_URL&&!!process.env.JOBS_PUBLIC_DATABASE_URL;
async function pool(kind:'admin'|'public') {
  if(!jobsReady()) throw new Error('JOBS_UNAVAILABLE');
  const connection=kind==='admin'?process.env.JOBS_DATABASE_URL:process.env.JOBS_PUBLIC_DATABASE_URL;
  const current=kind==='admin'?(adminPool??=new Pool({...databaseConfig(connection),max:2,application_name:'arms-jobs-admin'})):(publicPool??=new Pool({...databaseConfig(connection),max:2,application_name:'arms-jobs-public'}));
  if(!checked.has(current)) {
    const {rows:[safety]}=await current.query(`SELECT current_user AS name,
      EXISTS(SELECT 1 FROM pg_roles r WHERE pg_has_role(r.oid,'MEMBER') AND (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb)) AS elevated,
      EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('arms_jobs','arms_auth') AND pg_has_role(c.relowner,'MEMBER')) AS owner,
      has_schema_privilege('arms_jobs','CREATE') AS can_create,
      EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='arms_auth'
        AND (has_table_privilege(c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') OR has_any_column_privilege(c.oid,'SELECT,INSERT,UPDATE'))) AS auth_access,
      (has_table_privilege('arms_jobs.activity','INSERT,UPDATE,DELETE,TRUNCATE') OR has_any_column_privilege('arms_jobs.activity','INSERT,UPDATE')) AS audit_write,
      has_table_privilege('arms_jobs.jobs','DELETE,TRUNCATE') AS can_delete,
      (has_table_privilege('arms_jobs.jobs','SELECT,INSERT,UPDATE') OR has_any_column_privilege('arms_jobs.jobs','SELECT,INSERT,UPDATE')) AS base_access`);
    if(safety.name!==(kind==='admin'?'arms_jobs_runtime':'arms_jobs_reader') || safety.elevated || safety.owner || safety.can_create || safety.auth_access || safety.audit_write || safety.can_delete || (kind==='public'&&safety.base_access)) throw new Error('JOBS_ROLE_UNSAFE');
    checked.add(current);current.on('error',()=>{});
  }
  return current;
}
export async function authorizeJobs() {
  const auth=await getStaffAuth();
  return auth.authorize((await cookies()).get(staffCookie())?.value,['admin']);
}
export async function getJobsService() {
  // Authorization before opening the jobs connection, repeated by every operation.
  if(!await authorizeJobs()) throw new Error('FORBIDDEN');
  return jobsService({db:await pool('admin'),authorize:authorizeJobs});
}
export type StoredJob={id:string;slug:string;posting:ReturnType<typeof import('@/lib/job-posting.mjs').emptyJobPosting>;status:string;revision:number;published_at:string|null;expires_at:string|null;updated_at:string;approval_reference?:string|null};
function publicJob(row:Record<string,unknown>):Job {
  const period=row.salary_period as keyof typeof salaryPeriods;
  return {id:String(row.id),slug:String(row.slug),title:String(row.title),industrySlug:String(row.industry_slug),location:String(row.location),
    type:String(row.employment_type),experience:String(row.experience||'Experience details not specified'),
    pay:row.salary_min!==null&&row.salary_max!==null?`₹${Number(row.salary_min).toLocaleString('en-IN')}–₹${Number(row.salary_max).toLocaleString('en-IN')} ${salaryPeriods[period]}`:'Not disclosed',
    description:String(row.description),responsibilities:jobPostingLines(String(row.responsibilities)),requirements:jobPostingLines(String(row.requirements)),
    employer:String(row.employer||''),payrollModel:String(row.payroll_model),schedule:String(row.schedule||''),expiresAt:String(row.expires_at),isSample:false};
}
export async function getPublicJobs():Promise<{jobs:Job[];unavailable:boolean}> {
  if(process.env.JOBS_ENABLED!=='true') return {jobs:isDemo?sampleJobs:[],unavailable:false};
  try {
    const db=await pool('public');
    const result=await db.query('SELECT * FROM arms_jobs.public_jobs ORDER BY published_at DESC,id LIMIT 200');
    return {jobs:result.rows.map(publicJob),unavailable:false};
  } catch {return {jobs:[],unavailable:true};}
}
export async function getPublicJob(slug:string):Promise<{job:Job|null;unavailable:boolean}> {
  if(process.env.JOBS_ENABLED!=='true') return {job:isDemo?sampleJobs.find(job=>job.slug===slug)??null:null,unavailable:false};
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>100) return {job:null,unavailable:false};
  try {
    const db=await pool('public');
    const {rows:[row]}=await db.query('SELECT * FROM arms_jobs.public_jobs WHERE slug=$1',[slug]);
    return {job:row?publicJob(row):null,unavailable:false};
  } catch {return {job:null,unavailable:true};}
}
