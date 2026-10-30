import { NextResponse } from 'next/server';
import { BASE, COOKIE, verify } from './lib/auth.mjs';

export async function middleware(request) {
  const session = await verify(request.cookies.get(COOKIE)?.value || '');
  if (session) return NextResponse.next();
  // This is deliberately the only protected-data guard in the vulnerable profile.
  if (request.nextUrl.pathname.includes('/api/records')) {
    return NextResponse.json({ error: 'A valid target session is required.' }, { status: 401 });
  }
  const location = new URL(`${BASE}/login`, process.env.LAB_PUBLIC_ORIGIN);
  return NextResponse.redirect(location);
}
export const config = { matcher: ['/dashboard/:path*', '/api/records/:path*'] };
