import Link from 'next/link';
import {redirect,notFound} from 'next/navigation';
import {authorizeIntake,getIntakeReview,getDocumentReview,type IntakeRow,type DocumentSummary} from '@/lib/server/intake';
import {IntakeDetail} from '@/components/IntakeReview';
import {localizeTree} from '@/lib/i18n';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
import {isUuid} from '@/lib/intake/validation.mjs';
export const dynamic='force-dynamic';
export async function generateMetadata(){return localizedMetadata({title:'Submission review | Staff',robots:{index:false,follow:false}});}
export default async function ReviewDetail({params}:{params:Promise<{id:string}>}) {
 let authorized=false;try{authorized=!!await authorizeIntake();}catch{}
 if(!authorized)redirect('/admin/sign-in');
 const {id}=await params;if(!isUuid(id))notFound();
 let row:IntakeRow|undefined,documents:DocumentSummary[]=[];
 try {row=await(await getIntakeReview()).get(id);documents=await(await getDocumentReview()).list(id);}catch{row=undefined;}
 if(!row)return localizeTree(<section className="container section intake-review"><Link className="text-link" href="/admin">← Staff workspace</Link><h1>Submission review</h1><p className="notice" role="alert">This record could not be opened. It may be unavailable, expired or awaiting privacy review.</p></section>,await getLocale());
 return <IntakeDetail row={row} documents={documents} locale={await getLocale()}/>;
}
