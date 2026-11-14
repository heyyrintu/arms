import {localizeTree} from '@/lib/i18n';
import {getLocale} from '@/lib/server/locale';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {stageRoles} from '@/lib/staging/config.mjs';
import {stagePool} from '@/lib/server/staging';
export const dynamic='force-dynamic';
export default async function Mailbox(){if(process.env.ARMS_PRIVATE_STAGING!=='true')notFound();const db=await stagePool(stageRoles.capture);const {rows}=await db.query('SELECT id,kind,recipient,body,created_at FROM arms_stage.messages ORDER BY created_at DESC LIMIT 20');return localizeTree(<section className="container section narrow"><p className="eyebrow">PRIVATE SYNTHETIC MAIL CAPTURE</p><h1>Captured test mailbox</h1><p>This inbox contains only synthetic staging messages. No message is delivered externally. Access requires the staging gate.</p><div className="job-editor-actions"><Link className="text-link" href="/admin/sign-in">Staff sign-in ↗</Link><Link className="text-link" href="/admin/staging">Workflow tests ↗</Link></div>{rows.length?rows.map(row=><article className="staff-job-entry" key={row.id}><h2 data-original>{row.kind}</h2><p data-original>{row.recipient}</p><p data-original>{row.body}</p></article>):<p>No test messages captured yet.</p>}</section>,await getLocale());}
