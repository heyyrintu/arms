import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export const gateCookie='__Host-arms_stage_gate';
export function gateSecret(env) {const value=env.STAGING_GATE_PASSWORD;if(typeof value!=='string'||value.length<32)throw new Error('STAGING_GATE_UNAVAILABLE');return value;}
const signature=(value,secret)=>createHmac('sha256',secret).update('private-stage:'+value).digest('hex');
export function unlockGate(value,env) {
 const actual=createHash('sha256').update(typeof value==='string'?value:'').digest(),expected=createHash('sha256').update(gateSecret(env)).digest();return timingSafeEqual(actual,expected);
}
export function issueGate(env,now=Date.now()) {const value=String(now+8*3600000)+'.'+randomBytes(16).toString('hex');return value+'.'+signature(value,gateSecret(env));}
export function verifyGate(token,env,now=Date.now()) {
 try {if(typeof token!=='string'||token.length>160)return false;const [expiry,nonce,sig,...extra]=token.split('.');if(extra.length||!/^\d{13}$/.test(expiry)||!/^\w{32}$/.test(nonce)||!/^\w{64}$/.test(sig))return false;const deadline=Number(expiry);if(deadline<=now||deadline>now+8*3600000)return false;return timingSafeEqual(Buffer.from(sig),Buffer.from(signature(expiry+'.'+nonce,gateSecret(env))));}catch{return false;}
}
