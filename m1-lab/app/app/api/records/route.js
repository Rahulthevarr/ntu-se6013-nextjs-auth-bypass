import { marker, records } from '../../../lib/records.mjs';
export const dynamic = 'force-dynamic';
export async function GET() {
  // Authorisation intentionally lives only in middleware in this profile.
  return Response.json({ marker, synthetic: true, records }, { headers: { 'Cache-Control': 'no-store' } });
}
