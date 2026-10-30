import { BASE } from '../lib/auth.mjs';
export default function Home() {
  return <><p className="section-label">Public page</p><h1>A small application with a protected dashboard.</h1><p>This page is public inside the operator-gated lab. The dashboard and records API require a valid target session during normal requests.</p><p className="notice">All records are fictional. This intentionally vulnerable application is for the isolated coursework lab only.</p><nav><a className="primary" href={`${BASE}/login`}>Log in to the target</a><a href={`${BASE}/dashboard`}>Open protected dashboard</a></nav><p>The operator login and target login are separate. Signing into the control panel does not sign you into this application.</p></>;
}
