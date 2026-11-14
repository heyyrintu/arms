# 15 · Information the owner must provide before production

Codex can build layouts and secure plumbing using test fixtures, but cannot truthfully publish missing facts.

| Input | Why needed | Status |
|---|---|---|
| Verified full company/trading name | Website identity, privacy operator | Owner supplied ARMS Talent Partners Private Limited; public brand remains ARMS Talent Partners |
| Official domain | Canonical URLs, email & deploy | Pending |
| Approved company email/phone/address | Enquiry routing and support | Owner supplied info@armstalentpartners.com and Sector 48, Gurgaon, Haryana 122018; phone/hours pending |
| Business/legal payroll model documents | Accurate HR/admin descriptions | Pending |
| Operating geographies and language preferences | Copy, role filters, compliance | Hindi/English requested and implemented for owned UI; regional scope, actual engagement models and final language/content review remain pending |
| Actual vacancy data and approved salaries | Live job publishing | Pending; job storage, approval/publication and lifecycle are implemented/tested (docs/21), with no real vacancy supplied or published |
| Real ARMS/site photos and rights | Replace photography placeholders | Pending |
| Company privacy notice + retention schedule | Lawful collection and deletion | Draft notice and selected defaults added at owner request; operator/email/address supplied; legal review and enforcement pending |
| Admin users and role owners | Protected internal workflows | First administrator info@armstalentpartners.com confirmed and password/email-code sign-in verified; new job workflow needs owner review; additional users/assignments pending |
| Database/auth/file storage/email providers | Real backend integration | PostgreSQL + Lightsail + database staff sign-in + Amazon SES selected; DB read-only verified over SSH; private bucket attached to Ubuntu-1; owner approved dedicated DB setup; staff schema/restricted runtime login applied; SES sender noreply@armstalentpartners.com and admin recipient verified; restricted app sending access repaired and real delivery check accepted; first admin info@armstalentpartners.com created privately; actual password/email-code/workspace/sign-out verified with hosted session creation/revocation on 14 November 2026. Production operations and container bucket access remain open; saved auth disabled |
| Staging/production hosting approval | Deployment | Pending |
| Consent and notification text review | Candidate and employer acknowledgements | Pending |

No values in this list should be guessed or filled from unrelated personal context. Ask for the minimum details needed at the relevant build milestone.
