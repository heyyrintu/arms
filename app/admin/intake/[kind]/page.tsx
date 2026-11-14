import {redirect,notFound} from 'next/navigation';
import {authorizeIntake,getIntakeReview,type IntakeKind,type IntakeSummary} from '@/lib/server/intake';
import {IntakeList} from '@/components/IntakeReview';
import {getLocale,localizedMetadata} from '@/lib/server/locale';
export const dynamic='force-dynamic';
export async function generateMetadata(){return localizedMetadata({title:'Submission review | Staff',robots:{index:false,follow:false}});}
export default async function ReviewList({params}:{params:Promise<{kind:string}>}) {
 let authorized=false;try{authorized=!!await authorizeIntake();}catch{}
 if(!authorized)redirect('/admin/sign-in');
 const {kind}=await params;if(!['employer','talent','application'].includes(kind))notFound();
 let rows:IntakeSummary[]=[],unavailable=false;
 try{rows=await(await getIntakeReview()).list(kind);}catch{unavailable=true;}
 return <IntakeList kind={kind as IntakeKind} rows={rows} unavailable={unavailable} locale={await getLocale()}/>;
}
