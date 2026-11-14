import {reviewPermissionQuery,assertReviewPermissions} from '@/lib/intake/review-permissions.mjs';
import 'server-only';
import {stageEnabled} from '@/lib/staging/config.mjs';
import {cookies} from 'next/headers';
import {Pool} from 'pg';
import {S3Client} from '@aws-sdk/client-s3';
import {getStaffAuth,staffCookie} from './staff';
import {databaseConfig} from '@/scripts/lib/database-config.mjs';
import {intakeReviewService} from '@/lib/intake/service.mjs';
import {documentReview} from '@/lib/intake/documents.mjs';
import {cvObjectStorage} from '@/lib/intake/s3-storage.mjs';
import {privateBucketConfig} from './storage-config.mjs';
export type IntakeKind='employer'|'talent'|'application';
export type IntakeRow={id:string;kind:IntakeKind;job_id:string|null;status:string;revision:number;created_at:string;payload:Record<string,string|boolean>;notice_version:string;consent_at:string;future_roles_opt_in:boolean;application_delete_after:string|null;purpose_delete_after:string|null};
export type IntakeSummary=Pick<IntakeRow,'id'|'kind'|'job_id'|'status'|'revision'|'created_at'>;
export type DocumentSummary={id:string;scan_status:string;size_bytes:number;created_at:string};
let connection:Pool|undefined;
let checked:Promise<void>|undefined;
let s3:S3Client|undefined;
export async function authorizeIntake() {
 const auth=await getStaffAuth();return auth.authorize((await cookies()).get(staffCookie())?.value,['admin']);
}
async function reviewPool() {
 if(process.env.INTAKE_REVIEW_ENABLED!=='true'||!process.env.INTAKE_REVIEW_DATABASE_URL)throw new Error('INTAKE_UNAVAILABLE');
 connection??=new Pool({...databaseConfig(process.env.INTAKE_REVIEW_DATABASE_URL),max:2,application_name:'arms-intake-review'});
 checked??=(async()=>{
  const {rows:[safety]}=await connection!.query(reviewPermissionQuery);
  assertReviewPermissions(safety);
  connection!.on('error',()=>{});
 })().catch(error=>{checked=undefined;throw error;});
 await checked;return connection;
}
export async function getIntakeReview() {
 if(!await authorizeIntake())throw new Error('FORBIDDEN');
 return intakeReviewService({db:await reviewPool(),authorize:authorizeIntake});
}
export async function getDocumentReview() {
 if(!await authorizeIntake())throw new Error('FORBIDDEN');
 const db=await reviewPool(),review=intakeReviewService({db,authorize:authorizeIntake});
 // Listing scan state doesn't need bucket access; downloading does.
 const storage={get:async(key:string,size:number)=>{
  if(process.env.PRIVATE_CV_DOWNLOADS_ENABLED!=='true')throw new Error('DOCUMENT_UNAVAILABLE');
  if(stageEnabled(process.env)){const {privateStageStorage}=await import('./staging');return privateStageStorage().get(key,size);}
  const {bucket,...config}=privateBucketConfig(process.env);
  s3??=new S3Client({...config,maxAttempts:1});
  return cvObjectStorage({client:s3,bucket}).get(key,size);
 }};
 return documentReview({db,storage,authorize:authorizeIntake,review});
}
