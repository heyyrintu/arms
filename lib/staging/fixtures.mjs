import {stageJobId,stageNotice} from './config.mjs';
import {intakeIndustries,isUuid} from '../intake/validation.mjs';
export function syntheticCase(input) {
 if(!input||typeof input!=='object'||Array.isArray(input)||!isUuid(input.requestId))throw new Error('INVALID_REQUEST');
 if(Object.keys(input).some(key=>!['kind','industry','requestId','cv'].includes(key))||!['employer','talent','application'].includes(String(input.kind))||!intakeIndustries.filter(value=>value!=='other').includes(String(input.industry))||!['none','clean'].includes(String(input.cv)))throw new Error('INVALID_REQUEST');
 const kind=String(input.kind),values={requestId:input.requestId,name:'Synthetic staging person',email:'synthetic@example.invalid',phone:'+919000000000',location:'Synthetic private test location',consent:true,noticeVersion:stageNotice};
 if(kind==='employer')Object.assign(values,{company:'Synthetic staging business',industry:input.industry,headcount:'3',payrollModel:'undecided',requirements:'Synthetic workforce enquiry for private QA only.'});
 else Object.assign(values,{experience:'Synthetic private QA experience only.'},kind==='talent'?{industry:input.industry,preferredRole:'Synthetic staging role'}:{jobId:stageJobId,talentNetworkOptIn:false});
 return {kind,values};
}
