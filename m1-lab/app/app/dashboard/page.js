import { BASE } from '../../lib/auth.mjs';
import { marker, records } from '../../lib/records.mjs';
export const dynamic = 'force-dynamic';
export default function Dashboard() {
  // Adding a page-level guard here would change the M4 server-auth experiment.
  return <><p className="section-label">Protected dashboard</p><h1>Fictional records</h1><p className="notice">Synthetic lab data only. Access to this content is the observable protected-data condition, not proof of an administrator account.</p><p className="marker">Content marker: <code>{marker}</code></p><ul className="records">{records.map(record => <li key={record.id}><code>{record.id}</code><h2>{record.category}</h2><p>{record.note}</p></li>)}</ul><nav><a href={`${BASE}/api/records`}>Open records JSON</a><a href={`${BASE}/`}>Public page</a><form action={`${BASE}/api/logout`} method="post"><button type="submit">Log out of target</button></form></nav></>;
}
