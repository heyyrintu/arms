// Owner delegated selection of recruitment retention defaults on 14 Nov 2026.
// This version is a draft policy, not approval to collect or delete personal data.
export const privacyNotice = {
  version: "2026-11-14.v1",
  reviewedOn: "14 November 2026",
  status: "draft",
  legalOperator: "ARMS Talent Partners Private Limited",
  privacyEmail: "info@armstalentpartners.com",
  businessAddress: "Sector 48, Gurgaon, Haryana 122018, India",
} as const;

export const retentionSchedule = [
  { id: "applications", category: "Job applications", period: "12 months", trigger: "After the final recruitment decision, withdrawal or closure of the recruitment process, whichever occurs first.", detail: "Applies to the application and necessary review records. Future-role contact requires a separate talent-network opt-in." },
  { id: "talent", category: "Talent-network profiles", period: "24 months", trigger: "From your last affirmative activity or renewed opt-in.", detail: "A profile update, new application or confirmed renewal can count as activity. Recruiter views and unanswered messages do not restart the period." },
  { id: "cv", category: "CVs and attachments", period: "Linked to the recruitment purpose", trigger: "Until the last valid retention deadline for the application or separately opted-in talent profile that needs the document.", detail: "Remove unnecessary or superseded copies sooner. A CV must never be retained indefinitely just because another record still exists." },
  { id: "enquiries", category: "Employer enquiries", period: "24 months", trigger: "From the last meaningful business interaction, where no active client relationship requires the record.", detail: "Once an enquiry becomes a contract, keep only necessary information under the separate client-record schedule." },
  { id: "audit", category: "Security and access records", period: "12 months", trigger: "From the recorded event, subject to applicable mandatory requirements.", detail: "Keep minimal identifiers and event details; do not copy CVs, full form payloads or credentials into logs." },
  { id: "backups", category: "Backup copies", period: "Up to 90 days — proposed rotation target", trigger: "After deletion from active systems, subject to applicable mandatory retention and documented holds.", detail: "Restrict backup access and reapply deletion records before a restored backup returns to ordinary use. Provider capability and legal review must confirm this target before launch." },
] as const;
