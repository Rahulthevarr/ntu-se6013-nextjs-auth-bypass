import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { timingSafeEqual, createHash } from 'node:crypto';
import { allowedRoute, boundedBytes, targetCookie } from './gateway.mjs';

function required(name, minimum = 1) {
  const value = process.env[name];
  if (!value || value.length < minimum) throw new Error(`Missing or short ${name}`);
  return value;
}
const username = required('CONTROL_USER');
const password = required('CONTROL_PASSWORD', 24);
const origin = new URL(required('LAB_PUBLIC_ORIGIN')).origin;
const upstream = new URL(process.env.VULNERABLE_ORIGIN || 'http://vulnerable:3000').origin;
const fixedTarget = `${upstream}/lab/vulnerable`;
const assets = new Map(await Promise.all([
  ['/', 'index.html', 'text/html; charset=utf-8'],
  ['/panel.css', 'panel.css', 'text/css; charset=utf-8'],
  ['/panel.js', 'panel.js', 'text/javascript; charset=utf-8']
].map(async ([route, file, mime]) => [route, { body: await readFile(new URL(file, import.meta.url)), mime }])));
const hash = value => createHash('sha256').update(value).digest();
const expected = hash(`${username}:${password}`);
let inFlight = 0;
let failedAuth = 0;
let windowStart = Date.now();
function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}
async function targets() {
  const installed = { id: 'vulnerable', version: null, profile: 'middleware-only', installed: true, health: 'unavailable', appPath: '/lab/vulnerable/' };
  try {
    const response = await fetch(`${fixedTarget}/api/health`, { redirect: 'manual', signal: AbortSignal.timeout(3000) });
    const bytes = await boundedBytes(response.body, 4096);
    const identity = JSON.parse(bytes.toString());
    if (response.status !== 200 || identity.target !== 'vulnerable' || identity.profile !== 'middleware-only' || identity.version !== '14.2.24' || identity.ready !== true) throw new Error('Target identity mismatch');
    installed.version = identity.version;
    installed.health = 'ready';
  } catch { installed.error = 'Target health could not be verified. Retry after checking the target container.'; }
  return [installed, ...['patched', 'header-filter', 'server-auth'].map(id => ({ id, version: null, profile: id, installed: false, health: 'not-installed', appPath: null }))];
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  const targetPath = req.url.startsWith('/lab/');
  res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self'${targetPath ? " 'unsafe-inline'" : ''}; style-src 'self'${targetPath ? " 'unsafe-inline'" : ''}; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; object-src 'none'; form-action 'self'`);
  if (req.headers.host !== new URL(origin).host) return send(res, 421, 'Unexpected lab host.');
  if (req.url === '/healthz' && req.method === 'GET') return send(res, 200, 'control-plane-ready');
  if (Date.now() - windowStart >= 60000) { failedAuth = 0; windowStart = Date.now(); }
  if (failedAuth >= 20) return send(res, 429, 'Too many failed operator logins. Retry in one minute.');
  const rawAuth = req.headers.authorization || '';
  const supplied = rawAuth.startsWith('Basic ') && rawAuth.length < 1024 ? Buffer.from(rawAuth.slice(6), 'base64').toString() : '';
  if (!timingSafeEqual(hash(supplied), expected)) {
    failedAuth++;
    res.setHeader('WWW-Authenticate', 'Basic realm="Isolated coursework lab", charset="UTF-8"');
    return send(res, 401, 'Operator login required. Use CONTROL_USER and CONTROL_PASSWORD from your local environment.');
  }
  if (inFlight >= 8) return send(res, 503, 'Lab busy. Retry after the current requests finish.');
  inFlight++;
  try {
    const url = new URL(req.url, origin);
    if (url.origin !== origin) return send(res, 400, 'Relative lab routes only.');
    if (url.pathname === '/api/targets' && req.method === 'GET' && !url.search) return send(res, 200, JSON.stringify(await targets()), 'application/json');
    if (url.pathname === '/favicon.ico' && req.method === 'GET') return send(res, 204, '');
    const asset = assets.get(url.pathname);
    if (asset && ['GET', 'HEAD'].includes(req.method) && !url.search) return send(res, 200, req.method === 'HEAD' ? '' : asset.body, asset.mime);
    if (!allowedRoute(url.pathname, req.method)) return send(res, 404, 'No such lab route.');
    if (req.method === 'POST' && req.headers.origin !== origin) return send(res, 403, 'Same-origin form required.');
    const headers = {};
    const cookie = targetCookie(req.headers.cookie);
    if (cookie) headers.cookie = cookie;
    if (req.headers.accept) headers.accept = req.headers.accept;
    if (req.method === 'POST') {
      headers.origin = origin;
      headers['content-type'] = req.headers['content-type'] || '';
    }
    // Never forward operator credentials, arbitrary cookies, or framework-internal headers.
    const body = req.method === 'POST' ? await boundedBytes(req, 4096) : undefined;
    const response = await fetch(upstream + url.pathname + url.search, { method: req.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(5000) });
    const bytes = await boundedBytes(response.body, 2 * 1024 * 1024);
    const location = response.headers.get('location');
    if (location) {
      const redirect = new URL(location, origin);
      if (redirect.origin !== origin || !(redirect.pathname === '/lab/vulnerable' || redirect.pathname.startsWith('/lab/vulnerable/'))) throw new Error('Target returned a non-lab redirect');
      res.setHeader('Location', redirect.pathname + redirect.search);
    }
    const cookieOut = response.headers.get('set-cookie');
    if (cookieOut && cookieOut.startsWith('lab_vulnerable_session=')) res.setHeader('Set-Cookie', cookieOut);
    return send(res, response.status, req.method === 'HEAD' ? '' : bytes, response.headers.get('content-type') || 'application/octet-stream');
  } catch {
    if (!res.headersSent) send(res, 502, 'Lab request failed or exceeded its bounds. Check target health and retry.');
    else res.end();
  } finally { inFlight--; }
});
server.requestTimeout = 10000;
server.headersTimeout = 5000;
server.maxHeadersCount = 40;
server.listen(Number(process.env.PORT || 4317), process.env.HOST || '0.0.0.0', () => console.log('M1 control plane ready; target requests remain private.'));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
