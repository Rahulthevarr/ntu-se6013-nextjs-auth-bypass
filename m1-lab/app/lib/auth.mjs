import { issueSession, verifySession } from '../../shared/session.mjs';
export const TARGET = 'vulnerable';
export const BASE = '/lab/vulnerable';
export const COOKIE = 'lab_vulnerable_session';
export function required(name, minimum = 1) {
  const value = process.env[name];
  if (!value || value.length < minimum) throw new Error(`Missing or short ${name}`);
  return value;
}
export const verify = token => verifySession(token, required('LAB_SESSION_SECRET', 32), TARGET);
export const issue = () => issueSession(required('LAB_SESSION_SECRET', 32), TARGET, required('LAB_USER'));
export function cookieOptions() {
  return { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === 'true', path: BASE, maxAge: 900 };
}
export function sameOrigin(request) {
  return request.headers.get('origin') === required('LAB_PUBLIC_ORIGIN');
}
export async function sameValue(a, b) {
  const hash = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const x = new Uint8Array(await hash(a));
  const y = new Uint8Array(await hash(b));
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
