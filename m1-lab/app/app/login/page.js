import { BASE } from '../../lib/auth.mjs';
export default function Login({ searchParams }) {
  return <><p className="section-label">Target session</p><h1>Log in to the example app</h1><p>Use the disposable target credentials in your local environment file, not the operator credentials.</p>
    {searchParams.error && <p className="notice" role="alert">Login failed. Check the target username and password, then try again.</p>}
    <form action={`${BASE}/api/login`} method="post"><label htmlFor="username">Target username</label><input id="username" name="username" autoComplete="username" required maxLength={80}/><label htmlFor="password">Target password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256}/><button type="submit">Log in to target</button></form>
    <a href={`${BASE}/`}>Back to public page</a></>;
}
