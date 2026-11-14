'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale} from './LocaleProvider';
import {localizeTree,translate} from '@/lib/i18n';
import {intakeTransitions,statusLabels} from '@/lib/intake/statuses.mjs';
import type {IntakeKind} from '@/lib/server/intake';
export default function IntakeActions({id,kind,status,revision,documents=[]}:{id:string;kind:IntakeKind;status:string;revision:number;documents:{id:string;scan_status:string}[]}) {
 const locale=useLocale(),router=useRouter();
 const choices=(intakeTransitions[kind] as Record<string,string[]>)[status]??[];
 const [operation,setOperation]=useState<'save'|'download'>('save');
 const [selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false);
 async function change(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();if(busy||!selected)return;setOperation('save');setBusy(true);setMessage('');setError(false);
  try {
   const response=await fetch(`/api/staff/intake/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:selected,revision})});
   const output=await response.json();if(!response.ok)throw new Error(output.error);
   setMessage('Status saved.');setSelected('');router.refresh();
  } catch(error) {setError(true);setMessage(error instanceof Error?error.message:'The request could not be confirmed. Please try again later.');}
  finally{setBusy(false);}
 }
 async function download(documentId:string) {
  if(busy)return;setOperation('download');setBusy(true);setError(false);setMessage('');
  try {
   const response=await fetch(`/api/staff/documents/${documentId}/download`,{method:'POST'});
   if(!response.ok){const output=await response.json();throw new Error(output.error);}
   const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download='cv.pdf';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setMessage('CV download prepared.');
  }catch(error){setError(true);setMessage(error instanceof Error?error.message:'The request could not be confirmed. Please try again later.');}
  finally{setBusy(false);}
 }
 return localizeTree(<section className="intake-actions" aria-busy={busy}><h2>Review actions</h2>
 {choices.length?<form onSubmit={change}><label htmlFor="intake-status">Next status</label><select id="intake-status" required disabled={busy} value={selected} onChange={event=>setSelected(event.target.value)}><option value="">Select a status</option>{choices.map(value=><option key={value} value={value}>{statusLabels[value as keyof typeof statusLabels]}</option>)}</select><p className="fineprint">Choose a status after human review. This does not send a candidate decision email.</p><button className="button button-dark" disabled={busy||!selected}>{busy&&operation==='save'?'Saving…':'Save status'}</button></form>:<p>No further status changes are available.</p>}
 <h2>Private CV</h2>{documents.length?documents.map(doc=><div key={doc.id}><p>{doc.scan_status==='clean'?'Scan complete. Staff access is checked again for each download.':'CV is unavailable while scanning is pending, failed or rejected.'}</p><button type="button" className="button button-outline" disabled={busy||doc.scan_status!=='clean'} onClick={()=>download(doc.id)}>{busy&&operation==='download'?'Preparing download…':'Download CV'}</button></div>):<p>No CV is attached.</p>}
 <p role={error?'alert':'status'} aria-live="polite">{translate(message,locale)}</p></section>,locale);
}
