import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {hashPassword,validPassword,token} from '../../lib/auth/crypto.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
// Native form POSTs need a serialized same-origin Origin header; no-referrer
// makes browsers send Origin:null and conflicts with the strict Origin check.
const securityHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'strict-origin-when-cross-origin','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
// Operator-only, loopback-only, first-account helper. This is not a public app route.
export async function localStaffSetup({db,login,email,lifetimeMs=10*60*1000,port=0,onCreated=()=>{}}) {
  if(!Number.isInteger(lifetimeMs)||lifetimeMs<1000||lifetimeMs>60*60*1000||!Number.isInteger(port)||!(port===0||(port>=1024&&port<=65535))) throw new Error('INVALID_LOCAL_SETUP_WINDOW');
  const windowMinutes=Math.ceil(lifetimeMs/60000);
  const expiresAt=Date.now()+lifetimeMs;
  const csrf=token();let completed=false,busy=false,attempts=0,origin='',cookie='';
  const page=(message='',success=false)=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARMS administrator password setup</title><style>body{margin:0;background:#f6f3eb;color:#073f43;font:18px/1.5 Arial,sans-serif}main{max-width:600px;margin:60px auto;padding:24px}h1{line-height:1.12}form{display:grid;gap:14px}label{font-weight:bold}input,button{box-sizing:border-box;width:100%;padding:14px;font:inherit}button{background:#073f43;color:white;border:0;cursor:pointer}:focus-visible{outline:3px solid #0c777c;outline-offset:3px}small{display:block}</style><main><p>ARMS Talent Partners · private local setup</p><h1>${success?'Administrator account created':'Choose your administrator password'}</h1><p>Login and email: <strong>${escape(login)}</strong></p>${message?`<p role="${success?'status':'alert'}">${escape(message)}</p>`:''}${success?'<p>You can close this page. Staff sign-in remains off while email verification and final checks are completed.</p>':`<p>This page is available only on this computer and expires in ${windowMinutes} minutes. Your password is stored as a secure hash. Keep it out of chat.</p><form method="post" action="/create"><input type="hidden" name="csrf" value="${csrf}"><label for="password">New password</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="15" maxlength="1024" required aria-describedby="requirements"><small id="requirements">Use at least 15 characters. A long, unique passphrase works well.</small><label for="confirmation">Confirm password</label><input id="confirmation" name="confirmation" type="password" autocomplete="new-password" minlength="15" maxlength="1024" required><button>Create administrator account</button></form>`}</main></html>`;
  const respond=(response,status,body,extra={})=>{response.writeHead(status,{...securityHeaders,...extra});response.end(body);};
  const blocked='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reopen password setup</title><h1>Please reopen password setup</h1><p>This submission could not be verified. <a href="/">Open a fresh password form</a> and enter your password again. No account was created by this rejected request.</p></html>';
  const server=createServer(async(request,response)=>{
    if(Date.now()>=expiresAt) return respond(response,410,'Local setup expired. Ask your administrator to reopen it.');
    if(request.headers.host!==new URL(origin).host || request.headers['sec-fetch-site']==='cross-site') return respond(response,403,blocked);
    if(request.method==='GET' && request.url==='/') return respond(response,200,page(completed?'Your password has been saved securely.':'',completed),{'Set-Cookie':`${cookie}=${csrf}; HttpOnly; SameSite=Strict; Path=/`});
    if(request.method!=='POST'||request.url!=='/create') return respond(response,404,'Not found.');
    if(request.headers.origin!==origin || request.headers['content-type']?.split(';')[0]!=='application/x-www-form-urlencoded' || !request.headers.cookie?.split(/;\s*/).includes(`${cookie}=${csrf}`)) return respond(response,403,blocked);
    if(completed) return respond(response,409,'Setup is complete. Close this page.');
    if(busy || attempts>=5) return respond(response,429,'Setup is busy or too many attempts were made. Ask your administrator to restart local setup.');
    busy=true;
    try {
      const chunks=[];let bytes=0;
      for await(const chunk of request) {bytes+=chunk.length;if(bytes>8192) {respond(response,413,'Request too large.');return;}chunks.push(chunk);}
      const fields=new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
      if(fields.get('csrf')!==csrf) return respond(response,403,blocked);
      attempts++;
      const password=fields.get('password');
      if(!validPassword(password)||password!==fields.get('confirmation')) return respond(response,400,page('The passwords must match and meet the length requirement. Please enter them again.'));
      const hash=await hashPassword(password);
      await db.query('BEGIN');
      try {
        await db.query('LOCK TABLE arms_auth.staff_users IN SHARE ROW EXCLUSIVE MODE');
        const {rows:[row]}=await db.query('SELECT count(*)::integer AS count FROM arms_auth.staff_users');
        if(row.count!==0) throw new Error('FIRST_ACCOUNT_ALREADY_EXISTS');
        await db.query(`INSERT INTO arms_auth.staff_users (id,login_id,email,password_hash,role) VALUES ($1,$2,$3,$4,'admin')`,[randomUUID(),login,email,hash]);
        await db.query('COMMIT');
      } catch(error) {await db.query('ROLLBACK');throw error;}
      completed=true;
      respond(response,303,'Account created.',{Location:'/'});
      onCreated();
    } catch {if(!response.headersSent) respond(response,503,page('Account creation could not be confirmed. Contact your administrator before trying again.'));}
    finally {busy=false;}
  });
  server.requestTimeout=15000;server.headersTimeout=15000;server.keepAliveTimeout=1000;server.maxHeadersCount=30;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  origin=`http://127.0.0.1:${server.address().port}`;cookie=`arms_first_setup_${server.address().port}`;
  const expiry=setTimeout(()=>{server.close();server.closeAllConnections();},lifetimeMs);expiry.unref();
  server.once('close',()=>clearTimeout(expiry));
  return {origin,server,isComplete:()=>completed};
}
