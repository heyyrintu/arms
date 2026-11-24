import {notFound} from 'next/navigation';
import {getLocale} from '@/lib/server/locale';
import {localizeTree} from '@/lib/i18n';
export const dynamic='force-dynamic';
export default async function Unlock(){if(process.env.ARMS_PRIVATE_STAGING!=='true')notFound();return localizeTree(<section className="container section narrow staging-panel"><p className="eyebrow">PRIVATE SYNTHETIC STAGING</p><h1>Staging access</h1><p>For authorized testing only. Do not enter applicant details or real CVs.</p><form className="staff-sign-in" method="post" action="/api/staging/unlock"><label>Staging access password<input name="password" type="password" required autoComplete="current-password" maxLength={128}/></label><button className="button button-dark">Open private staging</button></form></section>,await getLocale());}
