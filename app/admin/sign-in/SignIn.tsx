'use client';
import {useRouter} from 'next/navigation';
import {useState, type FormEvent} from 'react';
export default function SignIn() {
  const router=useRouter();
  const [step,setStep]=useState<'login'|'verify'>('login');
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setPending(true);setError('');
    const form=event.currentTarget;
    const values=new FormData(form);
    const body=step==='login'?{loginId:values.get('loginId'),password:values.get('password')}:{code:values.get('code')};
    try {
      const response=await fetch(`/api/staff/${step==='login'?'login':'verify'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
      const data=await response.json();
      // Clear entered passwords/codes even on failure; never persist in browser storage.
      form.reset();
      if(!response.ok) {setError(data.error??'Sign-in is temporarily unavailable.');return;}
      if(data.step==='verify') setStep('verify');
      else {router.replace('/admin');router.refresh();}
    } catch {form.reset();setError('Unable to connect. Please try again.');}
    finally {setPending(false);}
  }
  return <form onSubmit={submit} className="staff-sign-in">
    {step==='login'?<>
      <label htmlFor="loginId">Staff login ID</label><input id="loginId" name="loginId" autoComplete="username" required maxLength={80}/>
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024}/>
    </>:<><p id="code-help">Enter the six-digit code sent to your registered staff email. It expires in 10 minutes.</p>
      <label htmlFor="code">Email code</label><input id="code" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} minLength={6} required aria-describedby="code-help" autoFocus/>
    </>}
    {error&&<p role="alert">{error}</p>}
    <button className="button button-dark" disabled={pending}>{pending?'Checking…':step==='login'?'Sign in':'Verify code'}</button>
    {step==='verify'&&<button type="button" className="button button-outline" disabled={pending} onClick={()=>{setStep('login');setError('');}}>Start again</button>}
    <p role="status" aria-live="polite">{pending?'Please wait.':''}</p>
  </form>;
}
