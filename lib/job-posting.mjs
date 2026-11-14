// Shared field checks; server parsing below rejects unknown/non-string input.
export const employmentTypes=['Full-time','Part-time','Contract','Temporary'];
export const payrollModels={arms:'ARMS-managed payroll',client:'Client-managed payroll',undecided:'To be confirmed by contract'};
export const salaryPeriods={monthly:'per month',annual:'per year',hourly:'per hour'};
export function emptyJobPosting() {
  return {title:'',slug:'',industrySlug:'',location:'',employmentType:'',employer:'',
    payrollModel:'undecided',experience:'',schedule:'',salaryIsPublic:'',salaryMin:'',salaryMax:'',
    salaryPeriod:'monthly',description:'',responsibilities:'',requirements:'',expiresOn:''};
}
export function jobPostingErrors(values,now=new Date()) {
  /** @type {Record<string,string>} */
  const errors={};
  const required={title:'Enter a job title.',slug:'Enter a URL slug.',industrySlug:'Choose an industry.',
    location:'Enter the work location.',employmentType:'Choose an employment type.',
    description:'Describe the role.',responsibilities:'Add at least one responsibility.',requirements:'Add at least one requirement.'};
  for(const [field,message] of Object.entries(required)) if(!values[field]?.trim()) errors[field]=message;
  for(const [field,maximum] of Object.entries({title:120,slug:100,location:160,employer:160,experience:160,schedule:240,description:5000,responsibilities:3000,requirements:3000})) {
    if(values[field]?.length>maximum) errors[field]=`Use ${maximum} characters or fewer.`;
  }
  if(values.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) errors.slug='Use lowercase letters, numbers and single hyphens only.';
  if(values.industrySlug && !['warehousing-fulfillment','transportation-drivers','cafes-hospitality','gig-work','other'].includes(values.industrySlug)) errors.industrySlug='Choose an available industry.';
  if(values.employmentType && !employmentTypes.includes(values.employmentType)) errors.employmentType='Choose an available employment type.';
  if(!Object.hasOwn(payrollModels,values.payrollModel)) errors.payrollModel='Choose a payroll arrangement.';
  if(values.salaryIsPublic==='yes') {
    for(const field of ['salaryMin','salaryMax']) {
      if(!/^\d{1,9}$/.test(values[field])) errors[field]='Enter a whole INR amount from 0 to 999,999,999.';
    }
    if(!errors.salaryMin && !errors.salaryMax && Number(values.salaryMax)<Number(values.salaryMin)) errors.salaryMax='Maximum pay must be at least the minimum.';
    if(!Object.hasOwn(salaryPeriods,values.salaryPeriod)) errors.salaryPeriod='Choose a pay period.';
  }
  if(values.expiresOn) {
    const date=new Date(`${values.expiresOn}T00:00:00Z`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(values.expiresOn) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==values.expiresOn || values.expiresOn<=now.toISOString().slice(0,10)) errors.expiresOn='Choose a valid future closing date.';
  }
  return errors;
}
export const jobPostingLines=value=>value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);

export function parseJobPosting(input,now=new Date()) {
  const values=emptyJobPosting();
  if(!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).some(key=>!Object.hasOwn(values,key))) return {errors:{posting:'Invalid job details.'}};
  for(const key of Object.keys(values)) {
    if(typeof input[key]!=='string') return {errors:{posting:'Every job field must be text.'}};
    values[key]=input[key].trim();
    if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(values[key])) return {errors:{[key]:'Remove unsupported control characters.'}};
  }
  if(!['','yes'].includes(values.salaryIsPublic)) return {errors:{salaryIsPublic:'Choose whether to show confirmed pay.'}};
  // Undisclosed pay is not retained as private salary data in this editor.
  if(values.salaryIsPublic!=='yes') {values.salaryMin='';values.salaryMax='';values.salaryPeriod='monthly';}
  const errors=jobPostingErrors(values,now);
  return Object.keys(errors).length?{errors}:{values,errors:{}};
}
// Closing dates end at 23:59:59.999 India time; never use the host timezone.
export const jobExpiry=posting=>posting.expiresOn?new Date(`${posting.expiresOn}T23:59:59.999+05:30`):null;
