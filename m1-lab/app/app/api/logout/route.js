import { NextResponse } from 'next/server';
import { BASE, COOKIE, cookieOptions, required, sameOrigin } from '../../../lib/auth.mjs';
export async function POST(request) {
  if (!sameOrigin(request)) return new Response('Same-origin form required.', { status: 403 });
  const response = NextResponse.redirect(new URL(`${BASE}/login`, required('LAB_PUBLIC_ORIGIN')), 303);
  response.cookies.set(COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}
