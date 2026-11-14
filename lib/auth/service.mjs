import {normalizeLogin, verifyPassword, token, tokenHash, validToken, emailCode, codeHash, equalHash} from './crypto.mjs';
export class AuthError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const sessionHours = 8;
async function transaction(db, work) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
async function event(db, action, userId = null) {
  await db.query('INSERT INTO arms_auth.security_events (action,user_id) VALUES ($1,$2)',[action,userId]);
}
async function limit(db, key, maximum, minutes) {
  const {rows:[row]} = await db.query(`INSERT INTO arms_auth.login_limits (key_hash,window_started_at,attempts) VALUES ($1,now(),1)
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts=CASE WHEN login_limits.window_started_at <= now()-make_interval(mins=>$2) THEN 1 ELSE login_limits.attempts+1 END,
      window_started_at=CASE WHEN login_limits.window_started_at <= now()-make_interval(mins=>$2) THEN now() ELSE login_limits.window_started_at END
    RETURNING attempts`,[tokenHash(key),minutes]);
  if (row.attempts > maximum) throw new AuthError('RATE_LIMITED');
}
/** A Pool-compatible database and a trusted server-side email sender are injected. */
export function staffAuth({db, secret, sendCode, requireEmail = true}) {
  async function createSession(client, user, verified) {
    const value = token();
    await client.query(`INSERT INTO arms_auth.staff_sessions (token_hash,user_id,auth_version,email_verified_at,expires_at)
      VALUES ($1,$2,$3,CASE WHEN $4 THEN now() END,now()+interval '8 hours')`,[tokenHash(value),user.id,user.auth_version,verified]);
    await event(client,'signed_in',user.id);
    return {step:'complete',session:value,maxAge:sessionHours*3600};
  }
  return {
    async start(login, password) {
      const id = normalizeLogin(login);
      if (!id || typeof password !== 'string' || Buffer.byteLength(password)>1024) throw new AuthError('INVALID_LOGIN');
      // Global cap does not trust spoofable proxy headers. Per-login cap is shared
      // by all app instances; unknown IDs follow the same password hashing path.
      await limit(db,'login-global',60,10);
      await limit(db,`login:${id}`,5,15);
      const {rows:[user]} = await db.query('SELECT id,email,password_hash,active,auth_version FROM arms_auth.staff_users WHERE login_id=$1',[id]);
      const verified = await verifyPassword(password, user?.password_hash);
      if (!verified || !user?.active) { await event(db,'login_rejected'); throw new AuthError('INVALID_LOGIN'); }
      if (!requireEmail) return transaction(db,async client=>{
        const {rows:[current]}=await client.query('SELECT id,active,auth_version FROM arms_auth.staff_users WHERE id=$1',[user.id]);
        if (!current?.active || current.auth_version!==user.auth_version) throw new AuthError('INVALID_LOGIN');
        return createSession(client,current,false);
      });
      const challenge=token(), code=emailCode();
      await transaction(db,async client=>{
        await client.query('SELECT key_hash FROM arms_auth.login_limits WHERE key_hash=$1 FOR UPDATE',[tokenHash(`login:${id}`)]);
        const {rows:[current]}=await client.query('SELECT active,auth_version FROM arms_auth.staff_users WHERE id=$1',[user.id]);
        if (!current?.active || current.auth_version!==user.auth_version) throw new AuthError('INVALID_LOGIN');
        await client.query('DELETE FROM arms_auth.login_challenges WHERE user_id=$1',[user.id]);
        await client.query(`INSERT INTO arms_auth.login_challenges (token_hash,user_id,auth_version,code_hash,expires_at)
          VALUES ($1,$2,$3,$4,now()+interval '10 minutes')`,[tokenHash(challenge),user.id,user.auth_version,codeHash(secret,challenge,code)]);
        await event(client,'password_accepted',user.id);
      });
      try {
        // No code goes to the browser, logs or a development console.
        await sendCode(user.email,code);
        const result=await db.query('UPDATE arms_auth.login_challenges SET delivered_at=now() WHERE token_hash=$1 AND expires_at>now() RETURNING token_hash',[tokenHash(challenge)]);
        if (!result.rows.length) throw new Error('CHALLENGE_REPLACED');
      } catch {
        await db.query('DELETE FROM arms_auth.login_challenges WHERE token_hash=$1',[tokenHash(challenge)]);
        await event(db,'email_failed',user.id);
        throw new AuthError('EMAIL_UNAVAILABLE');
      }
      return {step:'verify',challenge,maxAge:600};
    },
    async verify(challenge, code) {
      if (!validToken(challenge) || typeof code!=='string' || !/^\d{6}$/.test(code)) throw new AuthError('INVALID_CODE');
      await limit(db,'verify-global',120,10);
      // Commit failed attempts; throwing inside the transaction would roll them back.
      const result=await transaction(db,async client=>{
        const {rows:[row]}=await client.query(`SELECT c.*,u.active,u.auth_version AS current_version,
          c.expires_at>now() AS unexpired FROM arms_auth.login_challenges c JOIN arms_auth.staff_users u ON u.id=c.user_id
          WHERE c.token_hash=$1 FOR UPDATE OF c`,[tokenHash(challenge)]);
        if (!row || !row.active || !row.unexpired || !row.delivered_at || row.attempts>=5 || row.auth_version!==row.current_version) return null;
        await client.query('UPDATE arms_auth.login_challenges SET attempts=attempts+1 WHERE token_hash=$1',[tokenHash(challenge)]);
        if (!equalHash(codeHash(secret,challenge,code),row.code_hash)) return null;
        await client.query('DELETE FROM arms_auth.login_challenges WHERE token_hash=$1',[tokenHash(challenge)]);
        return createSession(client,{id:row.user_id,auth_version:row.current_version},true);
      });
      if (!result) throw new AuthError('INVALID_CODE');
      return result;
    },
    async authorize(value, allowedRoles) {
      if (!validToken(value)) return null;
      const {rows:[user]}=await db.query(`UPDATE arms_auth.staff_sessions s SET last_seen_at=now()
        FROM arms_auth.staff_users u WHERE s.token_hash=$1 AND s.user_id=u.id AND u.active
        AND s.auth_version=u.auth_version AND s.expires_at>now() AND s.last_seen_at>now()-interval '30 minutes'
        AND ($2=false OR s.email_verified_at IS NOT NULL) AND u.role=ANY($3::text[])
        RETURNING u.id,u.role`,[tokenHash(value),requireEmail,allowedRoles]);
      return user ?? null;
    },
    async logout(value) {
      if (!validToken(value)) return;
      await transaction(db,async client=>{
        const {rows:[row]}=await client.query('DELETE FROM arms_auth.staff_sessions WHERE token_hash=$1 RETURNING user_id',[tokenHash(value)]);
        if (row) await event(client,'signed_out',row.user_id);
      });
    },
  };
}
