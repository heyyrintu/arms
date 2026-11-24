import {redirect,notFound} from 'next/navigation';
import {authorizeIntake} from '@/lib/server/intake';
import {stageConfig} from '@/lib/staging/config.mjs';
import StageConsole from './StageConsole';
import {localizeTree} from '@/lib/i18n';
import {getLocale} from '@/lib/server/locale';
export const dynamic='force-dynamic';
export default async function Stage(){if(process.env.ARMS_PRIVATE_STAGING!=='true')notFound();stageConfig(process.env);let actor;try{actor=await authorizeIntake();}catch{}if(!actor)redirect('/admin/sign-in');return localizeTree(<section className="container section narrow staging-panel"><p className="eyebrow">PRIVATE STAGING / NOT A LIVE RECRUITMENT SYSTEM</p><h1>Workflow test workspace</h1><StageConsole/></section>,await getLocale());}
