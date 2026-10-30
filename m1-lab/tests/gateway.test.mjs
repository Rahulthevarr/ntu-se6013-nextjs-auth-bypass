import test from 'node:test';
import assert from 'node:assert/strict';
const gateway = await import('../control-ui/gateway.mjs').catch(() => ({}));

test('the browser gateway accepts only named application routes and static assets', () => {
  assert.equal(typeof gateway.allowedRoute, 'function', 'browser route boundary is missing');
  for (const p of ['/lab/vulnerable', '/lab/vulnerable/', '/lab/vulnerable/login', '/lab/vulnerable/dashboard', '/lab/vulnerable/api/records', '/lab/vulnerable/_next/static/chunks/main-abc.js']) assert.ok(gateway.allowedRoute(p, 'GET'));
  for (const p of ['/lab/patched/', '/lab/vulnerable/api/anything', '/lab/vulnerable/_next/image', '/lab/vulnerable/_next/static/../../api/login']) assert.ok(!gateway.allowedRoute(p, 'GET'));
  assert.ok(gateway.allowedRoute('/lab/vulnerable/api/login', 'POST'));
  assert.ok(!gateway.allowedRoute('/lab/vulnerable/dashboard', 'POST'));
});

test('only the selected target cookie crosses the browser boundary', () => {
  assert.equal(gateway.targetCookie('operator_session=secret; lab_patched_session=other; lab_vulnerable_session=signed.token'), 'lab_vulnerable_session=signed.token');
  assert.equal(gateway.targetCookie('other_cookie=private'), '');
  assert.equal(gateway.targetCookie('lab_vulnerable_session=bad value'), '');
});

test('the byte reader accepts the exact boundary and rejects one byte beyond it', async () => {
  const { Readable } = await import('node:stream');
  assert.equal((await gateway.boundedBytes(Readable.from([Buffer.from('abc'), Buffer.from('de')]), 5)).toString(), 'abcde');
  await assert.rejects(gateway.boundedBytes(Readable.from([Buffer.from('abc'), Buffer.from('def')]), 5), /byte limit/);
});
