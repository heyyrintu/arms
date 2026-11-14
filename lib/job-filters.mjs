// @ts-check
// Discovery only: callers must supply jobs already approved for public viewing.
const normalize = (/** @type {string} */ value) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * @template {{title:string,location:string,type:string,industrySlug:string}} T
 * @param {readonly T[]} jobs
 * @param {{query?:string,industry?:string,location?:string,employmentType?:string}} filters
 * @returns {T[]}
 */
export function filterJobs(jobs, {query="", industry="", location="", employmentType=""} = {}) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return jobs.filter(job => {
    if (industry && job.industrySlug !== industry) return false;
    if (location && job.location !== location) return false;
    if (employmentType && job.type !== employmentType) return false;
    const searchable = normalize(`${job.title} ${job.location} ${job.type} ${job.industrySlug.replaceAll("-", " ")}`);
    return terms.every(term => searchable.includes(term));
  });
}

/** @param {readonly {location:string,type:string}[]} jobs */
export function jobFilterOptions(jobs) {
  /** @param {string[]} values */
  const unique = values => [...new Set(values.filter(value => value.trim()))].sort((a,b) => a.localeCompare(b,"en"));
  return {locations: unique(jobs.map(job=>job.location)), employmentTypes: unique(jobs.map(job=>job.type))};
}
