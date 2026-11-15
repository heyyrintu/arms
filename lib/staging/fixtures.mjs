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

// Valid, fixed one-page PDF. Never takes applicant input or embeds metadata.
export function syntheticPdf() {
 const content='BT /F1 14 Tf 48 760 Td (Synthetic private QA resume) Tj 0 -24 Td (No real personal data. Not an application.) Tj ET\n';
 const objects=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`,
 ];
 let pdf='%PDF-1.7\n';const offsets=[0];
 for(const [index,body] of objects.entries()){offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${body}\nendobj\n`;}
 const xref=Buffer.byteLength(pdf);
 pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return Buffer.from(pdf);
}
