'use client';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
export default function SignOut() {
  const router=useRouter();
  const [error,setError]=useState('');const [pending,setPending]=useState(false);
  return <><button className="button button-dark" disabled={pending} onClick={async()=>{
    setPending(true);setError('');
    try {const result=await fetch('/api/staff/logout',{method:'POST'});if(!result.ok) throw new Error();router.replace('/admin/sign-in');router.refresh();}
    catch {setError('Unable to sign out. Please try again.');setPending(false);}
  }}>{pending?'Signing out…':'Sign out'}</button>{error&&<p role="alert">{error}</p>}</>;
}
