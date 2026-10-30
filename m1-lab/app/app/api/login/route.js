import { NextResponse } from 'next/server';
import { BASE, COOKIE, cookieOptions, issue, required, sameOrigin, sameValue } from '../../../lib/auth.mjs';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Same-origin form required.' }, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return new Response('Expected a form.', { status: 415 });
  const text = await request.text();
  if (text.length > 4096) return new Response('Form too large.', { status: 413 });
  const form = new URLSearchParams(text);
  const userOK = await sameValue(form.get('username') || '', required('LAB_USER'));
  const passwordOK = await sameValue(form.get('password') || '', required('LAB_PASSWORD', 16));
  if (!(userOK && passwordOK)) return NextResponse.redirect(new URL(`${BASE}/login?error=invalid`, required('LAB_PUBLIC_ORIGIN')), 303);
  const response = NextResponse.redirect(new URL(`${BASE}/dashboard`, required('LAB_PUBLIC_ORIGIN')), 303);
  response.cookies.set(COOKIE, await issue(), cookieOptions());
  return response;
}
