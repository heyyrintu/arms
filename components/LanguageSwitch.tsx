'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale} from './LocaleProvider';
import type {Locale} from '@/lib/i18n';
export default function LanguageSwitch() {
  const locale=useLocale(),router=useRouter();
  const [pending,setPending]=useState(false),[error,setError]=useState(false);
  async function choose(next:Locale) {
    if(next===locale||pending)return;
    setPending(true);setError(false);
    try {
      const response=await fetch('/api/language',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale:next}),signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error();
      router.refresh();
    } catch {setError(true);}finally{setPending(false);}
  }
  return <div className="language-control"><div className="language-switch" role="group" aria-label={locale==='hi'?'भाषा चुनें':'Choose language'}>
    <button type="button" lang="en" aria-pressed={locale==='en'} disabled={pending} onClick={()=>choose('en')}>EN</button><span aria-hidden="true">/</span><button type="button" lang="hi" aria-pressed={locale==='hi'} disabled={pending} onClick={()=>choose('hi')}>हिंदी</button>
    </div>{error&&<small role="alert">{locale==='hi'?'भाषा नहीं बदली जा सकी। फिर प्रयास करें।':'Could not change language. Try again.'}</small>}</div>;
}
