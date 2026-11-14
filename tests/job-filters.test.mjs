import assert from "node:assert/strict";
import {test} from "node:test";
import {filterJobs,jobFilterOptions} from "../lib/job-filters.mjs";

// Private unit fixtures only; never imported by public pages or the job feed.
const jobs = Object.freeze([
  Object.freeze({title:"Warehouse Associate",location:"Test North",type:"Full-time",industrySlug:"warehousing-fulfillment"}),
  Object.freeze({title:"Delivery Driver",location:"Test South",type:"Part-time",industrySlug:"transportation-drivers"}),
  Object.freeze({title:"Café Associate",location:"Test North",type:"Part-time",industrySlug:"cafes-hospitality"}),
]);

test("all filters combine, and clearing filters restores the original order",()=>{
  assert.deepEqual(filterJobs(jobs,{query:"associate",industry:"cafes-hospitality",location:"Test North",employmentType:"Part-time"}),[jobs[2]]);
  assert.deepEqual(filterJobs(jobs,{industry:"cafes-hospitality",location:"Test South"}),[]);
  assert.deepEqual(filterJobs(jobs,{employmentType:"Full-time"}),[jobs[0]]);
  assert.deepEqual(filterJobs(jobs,{}),jobs);
});
test("keyword search ignores case, accents and extra whitespace across fields",()=>{
  assert.deepEqual(filterJobs(jobs,{query:"  CAFE   NORTH "}),[jobs[2]]);
  assert.deepEqual(filterJobs(jobs,{query:"transportation driver"}),[jobs[1]]);
  assert.deepEqual(filterJobs(jobs,{query:"cafe driver"}),[]);
  assert.deepEqual(filterJobs(jobs,{query:"   "}),jobs);
});
test("options come only from supplied jobs and do not duplicate locations",()=>{
  assert.deepEqual(jobFilterOptions(jobs),{locations:["Test North","Test South"],employmentTypes:["Full-time","Part-time"]});
  assert.deepEqual(jobFilterOptions([]),{locations:[],employmentTypes:[]});
});
test("empty or unknown selections never manufacture results",()=>{
  assert.deepEqual(filterJobs([],{}),[]);
  assert.deepEqual(filterJobs(jobs,{location:"not-published"}),[]);
  assert.deepEqual(filterJobs(jobs,{industry:"not-published"}),[]);
  assert.deepEqual(filterJobs(jobs,{employmentType:"not-published"}),[]);
});
