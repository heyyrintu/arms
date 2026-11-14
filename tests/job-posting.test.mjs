import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyJobPosting,jobPostingErrors,jobPostingLines} from '../lib/job-posting.mjs';

// Isolated UI fixtures only; never stored or imported into the public job feed.
const now=new Date('2026-11-14T12:00:00Z');
const valid=()=>({...emptyJobPosting(),title:'Private UI fixture',slug:'private-ui-fixture',industrySlug:'cafes-hospitality',
  location:'Test location',employmentType:'Contract',description:'Fixture description',responsibilities:'First task\nSecond task',requirements:'Relevant skill'});

test('editor starts without a preferred industry or invented role and validates required fields',()=>{
  const empty=emptyJobPosting();
  assert.equal(empty.industrySlug,'');assert.equal(empty.title,'');assert.equal(empty.salaryIsPublic,'');
  assert.equal(empty.payrollModel,'undecided');
  assert.deepEqual(Object.keys(jobPostingErrors(empty,now)).sort(),['title','slug','industrySlug','location','employmentType','description','responsibilities','requirements'].sort());
  for(const industrySlug of ['warehousing-fulfillment','transportation-drivers','cafes-hospitality','gig-work']) {
    assert.deepEqual(jobPostingErrors({...valid(),industrySlug},now),{});
  }
});
test('preview rejects unsafe slugs, unknown selections, oversized copy and invalid dates',()=>{
  const errors=jobPostingErrors({...valid(),slug:'../Not Safe',industrySlug:'unknown',employmentType:'unknown',payrollModel:'unknown',description:'x'.repeat(5001),expiresOn:'2027-02-30'},now);
  for(const key of ['slug','industrySlug','employmentType','payrollModel','description','expiresOn']) assert.ok(errors[key],key);
  for(const expiresOn of ['2026-11-13','2026-11-14']) assert.ok(jobPostingErrors({...valid(),expiresOn},now).expiresOn);
  assert.deepEqual(jobPostingErrors({...valid(),expiresOn:'2026-11-15'},now),{});
});
test('public pay requires confirmed whole amounts and an ordered range; hidden pay remains optional',()=>{
  assert.deepEqual(jobPostingErrors({...valid(),salaryMin:'bad',salaryMax:'bad'},now),{});
  for(const [salaryMin,salaryMax] of [['',''],['1.5','2'],['-1','2'],['100','50']]) {
    const errors=jobPostingErrors({...valid(),salaryIsPublic:'yes',salaryMin,salaryMax},now);
    assert.ok(errors.salaryMin||errors.salaryMax);
  }
  assert.deepEqual(jobPostingErrors({...valid(),salaryIsPublic:'yes',salaryMin:'100',salaryMax:'100'},now),{});
  assert.ok(jobPostingErrors({...valid(),salaryIsPublic:'yes',salaryMin:'100',salaryMax:'200',salaryPeriod:'weekly'},now).salaryPeriod);
  assert.deepEqual(jobPostingLines(' First task\r\n\nSecond task '),['First task','Second task']);
});
