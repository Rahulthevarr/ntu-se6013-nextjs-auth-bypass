import test from 'node:test';
import assert from 'node:assert/strict';
const base = process.env.LAB_TEST_ORIGIN;
const marker = 'M1-FICTIONAL-RECORDS-ONLY';
const path = '/lab/vulnerable';
const auth = Buffer.from(`${process.env.CONTROL_USER}:${process.env.CONTROL_PASSWORD}`).toString('base64');
const headers = { Authorization: `Basic ${auth}` };

test('the actual application enforces normal login and logout', { skip: !base }, async () => {
  const request = (p, options = {}) => fetch(base + p, { redirect: 'manual', ...options, headers: { ...headers, ...options.headers } });
  const publicPage = await request(path);
  assert.equal(publicPage.status, 200);
  const publicBody = await publicPage.text();
  assert.ok(publicBody.includes('A small application with a protected dashboard.'));
  assert.ok(!publicBody.includes(marker));
  const slash = await request(path + '/');
  assert.equal(slash.status, 308);
  assert.equal(slash.headers.get('location'), path);
  const denied = await request(path + '/dashboard');
  assert.equal(denied.status, 307);
  assert.ok(denied.headers.get('location').endsWith(path + '/login'));
  assert.ok(!(await denied.text()).includes(marker));
  const fake = await request(path + '/api/records', { headers: { Cookie: 'lab_vulnerable_session=yes' } });
  assert.equal(fake.status, 401);
  assert.ok(!(await fake.text()).includes(marker));
  const wrong = await request(path + '/api/login', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'username=wrong&password=wrong' });
  assert.equal(wrong.status, 303);
  assert.ok(!wrong.headers.get('set-cookie'));
  const csrf = await request(path + '/api/login', { method: 'POST', headers: { Origin: 'https://other.invalid', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'username=wrong&password=wrong' });
  assert.equal(csrf.status, 403);
  const login = await request(path + '/api/login', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username: process.env.LAB_USER, password: process.env.LAB_PASSWORD }) });
  assert.equal(login.status, 303);
  const cookieHeader = login.headers.get('set-cookie');
  assert.match(cookieHeader, /HttpOnly/i);
  assert.match(cookieHeader, /SameSite=Strict/i);
  assert.match(cookieHeader, /Path=\/lab\/vulnerable/);
  const cookie = cookieHeader.split(';')[0];
  const page = await request(path + '/dashboard', { headers: { Cookie: cookie } });
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes(marker));
  const records = await request(path + '/api/records', { headers: { Cookie: cookie } });
  assert.equal(records.status, 200);
  assert.equal((await records.json()).marker, marker);
  const logout = await request(path + '/api/logout', { method: 'POST', headers: { Origin: base, Cookie: cookie } });
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await request(path + '/dashboard')).status, 307);
});

test('operator access and fixed browser routes fail closed', { skip: !base }, async () => {
  assert.equal((await fetch(base + '/api/targets')).status, 401);
  assert.equal((await fetch(base + path + '/dashboard')).status, 401);
  const response = await fetch(base + '/api/targets', { headers });
  assert.equal(response.status, 200);
  const targets = await response.json();
  assert.equal(targets.length, 4);
  assert.equal(targets[0].health, 'ready');
  assert.equal(targets[0].version, '14.2.24');
  assert.ok(targets.slice(1).every(t => t.health === 'not-installed'));
  for (const route of ['/proxy?url=http://example.com', '/lab/patched/dashboard', path + '/api/missing']) {
    assert.equal((await fetch(base + route, { headers })).status, 404);
  }
  const response2 = await fetch(base + path + '/api/records', { headers: { ...headers, 'x-middleware-subrequest': 'external-untrusted', Cookie: 'lab_vulnerable_session=invalid' } });
  assert.equal(response2.status, 401);
});
