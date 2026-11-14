# Privacy notice and recruitment retention — 14 November 2026

The owner requested a privacy notice and delegated selection of market-informed retention defaults. The tailored notice is implemented at `/privacy`; `content/privacy.ts` is the shared, versioned source for the displayed schedule and form summaries. This is a draft for legal/company review, not a claim of compliance or approval to collect data. No legal identity, email or address has been invented.

## Selected project defaults

| Record | Ordinary retention | Clock / condition |
| --- | --- | --- |
| Job application and relevant review records | 12 calendar months | Final decision, withdrawal or process closure, whichever first |
| Separately opted-in talent profile | 24 calendar months | Candidate's last affirmative activity or renewed opt-in |
| CV / attachment | Last valid linked recruitment-purpose deadline | Only retain while at least one application/profile needs it; remove unnecessary/superseded copies sooner |
| Inactive employer enquiry | 24 calendar months | Last meaningful business contact; active client records move to a separate schedule |
| Minimal security/audit records | 12 calendar months | Event date, subject to applicable mandatory minimums |
| Backup copies after active-system deletion | Up to 90 days | Proposed rotation target; provider/legal validation required; mandatory retention/holds override |

These are selected defaults under the owner's instruction, not a universal statutory schedule. Recruitment profiles do not inherit payroll, tax, employee or active-contract retention periods. Applicable legal minimums and specifically documented holds override ordinary eligibility, with restricted use and periodic review. A request/withdrawal can end optional use before ordinary expiry; it cannot override a mandatory preservation requirement.

Recruiter views, exports, automated mail and unanswered reminders must not renew the talent clock. A new application must not silently enrol someone in future-role contact. A CV shared by valid purposes may be kept to the last applicable deadline, but a retained audit ID must not justify keeping the full CV. Use genuinely irreversible anonymisation or deletion; a soft-delete flag alone is not erasure.

## Research and limits

- Adecco's published candidate schedule lists **two years from last activity for India**. This supports the chosen 24-month talent default; it does not establish a universal market or legal rule. [Adecco candidate retention](https://www.adeccogroup.com/privacy-policy/candidate-retention-periods-en)
- Randstad India's published policy describes three years for unsuccessful/unplaced candidate records and different periods for placements/financial records. A duplicate-URL indexed version differed, so no single peer policy is treated as binding or copied wholesale. [Randstad India privacy policy](https://www.randstad.in/privacy-policy/)
- ManpowerGroup India uses a purpose/necessity/local-law approach rather than publishing one universal candidate period. [ManpowerGroup India notice](https://www.manpowergroup.co.in/privacy-notice.html)
- The 2025 DPDP Rules Gazette provides staged commencement. Rule 1(4) gives an eighteen-month commencement for rules 3, 5–16, 22–23. Rules 6 and 8 include security/data-log retention requirements, and rule 9 addresses contact details. Counsel must check the operative provisions, subsequent corrections/notifications and actual processing model before launch; do not describe every provision as already effective on 14 November 2026. [Official MeitY Gazette](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)

The 12-month application period, 24-month enquiry period, 90-day backup target and seven-day acknowledgement/30-day request-resolution targets are project choices, not claims that a source prescribes them. The schedule is not a substitute for reviewing applicable Indian IT/privacy, security logging, labour, tax and contractual obligations. In particular, do not promise unconditional immediate deletion or purge backups earlier than an applicable minimum.

## Notice coverage

The draft identifies intended categories/purposes, sources, recipients, provider/transfer checks, minimisation, separate application/talent/marketing choices, retention, request/withdrawal routes, age-policy assumption, cookies and notice versioning. It distinguishes planned security controls from working integrations. It does not claim CV storage, acknowledgements, automatic deletion or a rights-request inbox already work.

Forms remain disabled. Their preview text is purpose-specific, uses the same notice version and retention source, and includes a separate optional future-role choice for a specific application. Before enabling any form, the server must enforce the current notice/version and approved purposes rather than trust a posted browser value.

## Required owner/legal particulars

The owner supplied the legal operator **ARMS Talent Partners Private Limited**, privacy/support email **info@armstalentpartners.com**, and business address **Sector 48, Gurgaon, Haryana 122018, India**. These are now displayed from the shared privacy source. This is owner-supplied verification, not an independent company-registry check. Operating jurisdictions, approved language/age policy, the person responsible for request handling and legal sign-off remain open. Provider regions/contracts/transfers, request handling and legal exceptions must be confirmed. Do not publish a made-up DPO, email, company registration or full-compliance assertion. The public draft identifies the operator and contact channel while preserving its review status; no real data should be collected until they are resolved.

## Implementation work before collection

1. Store notice version, purpose-specific consent/opt-in and timestamp on the server. Keep application permission separate from talent-network permission and unrelated marketing.
2. Track purpose-specific start/deadline dates, last affirmative candidate activity, legal-minimum dates and narrowly scoped holds. Compute expiry in UTC using calendar months with end-of-month clamping, not a fixed 365-day approximation.
3. Run a monitored daily eligibility scan. Until legal review and tested deletion exist, keep it dry-run only; record no raw applicant details in logs. Expired optional records must stop appearing in ordinary recruiter searches.
4. When authorised deletion is implemented, remove dependent application/CV references and object versions; handle rejected/quarantined uploads, stale exports and processor copies. Retain only minimal permitted proof of completion or hold.
5. Rotate eligible backups within the approved cycle, isolate them from ordinary use, and reapply deletions/withdrawals after restoration before opening access.
6. Test expiry boundaries, opt-out/withdrawal, a CV linked to multiple purposes, active holds/minimums, deletion retries, restoration and audit permissions with synthetic fixtures.

No deletion scheduler, database policy migration or personal-data collection has been activated by this change. The launch checklist remains unsigned.
