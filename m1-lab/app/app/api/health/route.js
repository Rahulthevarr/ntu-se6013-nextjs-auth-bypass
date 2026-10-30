import nextPackage from 'next/package.json';
export const dynamic = 'force-dynamic';
export async function GET() {
  const ready = ['LAB_SESSION_SECRET', 'LAB_PASSWORD', 'LAB_USER', 'LAB_PUBLIC_ORIGIN'].every(name => Boolean(process.env[name]));
  return Response.json({ target: 'vulnerable', version: nextPackage.version, profile: 'middleware-only', ready }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
