export const intakeKinds=['employer','talent','application'];
export const intakeIndustries=['warehousing-fulfillment','transportation-drivers','cafes-hospitality','gig-work','other'];
export const isUuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const common=['requestId','name','email','phone','location','consent','noticeVersion'];
const extra={employer:['company','industry','headcount','payrollModel','requirements'],talent:['industry','preferredRole','experience'],application:['jobId','experience','talentNetworkOptIn']};
// Bounded plain JSON only. A future multipart adapter must reject repeated fields
// and enforce a streaming byte limit before invoking this parser.
export function parseIntake(kind,input,noticeVersion) {
  const errors={},values={};
  if(!intakeKinds.includes(kind) || !input || typeof input!=='object' || Array.isArray(input) || ![Object.prototype,null].includes(Object.getPrototypeOf(input))) return {errors:{form:'Invalid request.'}};
  if(Object.keys(input).some(key=>![...common,...extra[kind]].includes(key))) errors.form='Unsupported fields.';
  function text(key,max,required=true,multiline=false) {
    const value=input[key]??'';
    if(typeof value!=='string' || value.length>max || (multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/:/[\u0000-\u001f\u007f]/).test(value) || (required&&!value.trim())) {errors[key]='Check this field.';values[key]='';return;}
    values[key]=value.trim().normalize('NFC');
    if(values[key].length>max) errors[key]='Check this field.';
  }
  text('name',120);text('email',180,kind==='employer');text('phone',20);text('location',160);
  values.email=values.email.toLowerCase();
  if(values.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email='Enter a valid email address.';
  // Require an explicit country code: do not guess operating jurisdiction.
  values.phone=values.phone.replace(/[ ()-]/g,'');
  if(!/^\+[1-9]\d{7,14}$/.test(values.phone)) errors.phone='Include the country code, for example +91.';
  if(!isUuid(input.requestId)) errors.requestId='Invalid retry reference.';
  if(input.consent!==true) errors.consent='Consent is required.';
  if(typeof noticeVersion!=='string'||!noticeVersion||input.noticeVersion!==noticeVersion) errors.noticeVersion='Review the current privacy notice.';
  if(kind==='employer'||kind==='talent') {
    text('industry',40);if(!intakeIndustries.includes(values.industry)) errors.industry='Select an industry.';
  }
  if(kind==='employer') {
    text('company',120);text('requirements',2500,true,true);text('payrollModel',12);text('headcount',6);
    if(!['arms','client','undecided'].includes(values.payrollModel)) errors.payrollModel='Select a payroll preference.';
    if(!/^[1-9]\d{0,5}$/.test(values.headcount)||Number(values.headcount)>100000) errors.headcount='Enter a headcount from 1 to 100000.';
  } else {
    text('experience',1800,true,true);
    if(kind==='talent') text('preferredRole',140);
    else {
      if(!isUuid(input.jobId)) errors.jobId='Invalid job.';
      values.jobId=input.jobId;
      if(input.talentNetworkOptIn!==undefined&&typeof input.talentNetworkOptIn!=='boolean') errors.talentNetworkOptIn='Invalid optional choice.';
      values.talentNetworkOptIn=input.talentNetworkOptIn===true;
    }
  }
  if(Object.keys(errors).length) return {errors};
  return {values,requestId:input.requestId.toLowerCase()};
}
