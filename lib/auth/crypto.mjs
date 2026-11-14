import {createHash, createHmac, randomBytes, randomInt, scrypt as derive, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt = promisify(derive);
let activeDerivations=0;
async function passwordKey(password,salt) {
  if (activeDerivations>=2) throw new Error('PASSWORD_BUSY');
  activeDerivations++;
  try {return await scrypt(password,salt,64,options);}
  finally {activeDerivations--;}
}
const options = {N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024};
export function normalizeLogin(value) {
  const id = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return /^[a-z0-9][a-z0-9._@+-]{2,79}$/.test(id) ? id : null;
}
export function validPassword(value) {
  return typeof value === 'string' && [...value].length >= 15 && Buffer.byteLength(value, 'utf8') <= 1024;
}
export async function hashPassword(password) {
  if (!validPassword(password)) throw new Error('PASSWORD_POLICY');
  const salt = randomBytes(16);
  const key = await passwordKey(password, salt);
  return `scrypt$131072$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}
// Fixed parameters prevent corrupted hashes from requesting unbounded resources.
export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || Buffer.byteLength(password) > 1024) return false;
  const match = /^scrypt\$131072\$8\$1\$([0-9a-f]{32})\$([0-9a-f]{128})$/.exec(stored ?? '');
  const salt = Buffer.from(match?.[1] ?? '0'.repeat(32), 'hex');
  const expected = Buffer.from(match?.[2] ?? '0'.repeat(128), 'hex');
  const actual = await passwordKey(password, salt);
  return timingSafeEqual(actual, expected) && !!match;
}
export function token() { return randomBytes(32).toString('base64url'); }
export function tokenHash(value) { return createHash('sha256').update(value).digest('hex'); }
export function validToken(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value); }
export function emailCode() { return String(randomInt(0, 1000000)).padStart(6, '0'); }
export function codeHash(secret, challenge, code) {
  if (typeof secret !== 'string' || secret.length < 43) throw new Error('AUTH_SECRET_MISSING');
  return createHmac('sha256', secret).update(`staff-email:${challenge}:${code}`).digest('hex');
}
export function equalHash(a, b) {
  return /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a,'hex'), Buffer.from(b,'hex'));
}
export function requiresEmailCode(environment, developmentOptOut) {
  return environment !== 'development' || developmentOptOut !== 'true';
}
