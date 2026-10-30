import test from 'node:test';
import assert from 'node:assert/strict';
const sessions = await import('../shared/session.mjs').catch(() => ({}));
const secret = 'a'.repeat(64);

test('a server-issued session identifies its target and user', async () => {
  assert.equal(typeof sessions.issueSession, 'function', 'session issuer is not implemented');
  const token = await sessions.issueSession(secret, 'vulnerable', 'analyst', 1000);
  const session = await sessions.verifySession(token, secret, 'vulnerable', 1001);
  assert.equal(session.user, 'analyst');
  assert.equal(session.target, 'vulnerable');
  assert.equal(session.exp, 1900);
  assert.ok(session.id.length >= 32);
});

test('sessions cannot cross targets or outlive their expiry', async () => {
  const token = await sessions.issueSession(secret, 'vulnerable', 'analyst', 1000);
  assert.equal(await sessions.verifySession(token, secret, 'patched', 1001), null);
  assert.equal(await sessions.verifySession(token, secret, 'vulnerable', 1900), null);
  assert.equal(await sessions.verifySession(token, secret, 'vulnerable', 999), null);
});

test('tampering, truncation, extra segments and another secret are rejected', async () => {
  const token = await sessions.issueSession(secret, 'vulnerable', 'analyst', 1000);
  for (const invalid of ['', 'session=yes', token + '.extra', token.slice(1), 'x.' + token.split('.')[1]]) {
    assert.equal(await sessions.verifySession(invalid, secret, 'vulnerable', 1001), null);
  }
  assert.equal(await sessions.verifySession(token, 'b'.repeat(64), 'vulnerable', 1001), null);
});
