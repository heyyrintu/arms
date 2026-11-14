"use client";
import {useMemo,useRef,useState} from "react";
import Link from "next/link";
import {type Job,industryName,industries} from "@/content/site";
import {filterJobs,jobFilterOptions} from "@/lib/job-filters.mjs";
export default function JobExplorer({jobs,initialIndustry="all"}:{jobs:Job[];initialIndustry?:string}){
 const searchInput=useRef<HTMLInputElement>(null);
 const [query,setQuery]=useState("");const [industry,setIndustry]=useState(initialIndustry);
 const [location,setLocation]=useState("");const [employmentType,setEmploymentType]=useState("");
 const options=useMemo(()=>jobFilterOptions(jobs),[jobs]);
 const visible=useMemo(()=>filterJobs(jobs,{query,industry:industry==="all"?"":industry,location,employmentType}),[jobs,industry,query,location,employmentType]);
 const filtered=Boolean(query||industry!=="all"||location||employmentType);
 function clearFilters(){setQuery("");setIndustry("all");setLocation("");setEmploymentType("");searchInput.current?.focus();}
 return <section aria-label="Job search" className="job-explorer">
  <div className="job-filters"><label>Search roles or locations<input ref={searchInput} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Driver or Gurugram"/></label><label>Industry<select value={industry} onChange={e=>setIndustry(e.target.value)}><option value="all">All industries</option>{industries.map(i=><option value={i.slug} key={i.slug}>{i.name}</option>)}</select></label></div>
  <div className="job-filters job-extra-filters">
   <label>Location<select value={location} onChange={e=>setLocation(e.target.value)}><option value="">All locations</option>{options.locations.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
   <label>Employment type<select value={employmentType} onChange={e=>setEmploymentType(e.target.value)}><option value="">All employment types</option>{options.employmentTypes.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
  </div>
  <div className="job-results-toolbar"><p className="results-count" role="status" aria-live="polite" aria-atomic="true">{visible.length} {visible.length===1?"listing":"listings"} shown</p>{filtered&&<button type="button" className="text-link clear-filters" onClick={clearFilters}>Clear filters</button>}</div>
  {visible.length?<div className="job-list">{visible.map(job=><article key={job.id} className="job-item"><div><p className="eyebrow">{industryName(job.industrySlug)} {job.isSample?"· DEMONSTRATION ONLY":""}</p><h2>{job.title}</h2><p className="job-meta">{job.location} <span aria-hidden="true">·</span> {job.type} <span aria-hidden="true">·</span> {job.experience}</p></div><Link href={`/jobs/${job.slug}`} className="text-link">View details ↗</Link></article>)}</div>:<div className="empty-state"><h2>No matching jobs shown.</h2><p>{jobs.length===0?"No verified live vacancies have been published yet.":"Try different filters or clear them to see all available listings."} Talent registration is not open yet; you can review the registration preview.</p><Link className="text-link" href="/talent-network">Join Talent Network ↗</Link></div>}
 </section>;
}
