import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const destination = fileURLToPath(new URL('../.env', import.meta.url));
const content = [
  'LAB_PORT=4317',
  'LAB_PUBLIC_ORIGIN=http://127.0.0.1:4317',
  'CONTROL_USER=operator',
  `CONTROL_PASSWORD=${randomBytes(24).toString('hex')}`,
  'LAB_USER=analyst',
  `LAB_PASSWORD=${randomBytes(24).toString('hex')}`,
  `LAB_SESSION_SECRET=${randomBytes(32).toString('hex')}`,
  'COOKIE_SECURE=false', ''
].join('\n');
try {
  writeFileSync(destination, content, { flag: 'wx', mode: 0o600 });
  console.log('Created m1-lab/.env with separate random operator and target credentials. Open it locally to read them.');
} catch (error) {
  console.error(error.code === 'EEXIST' ? 'Refusing to replace an existing .env. Keep it, or remove it deliberately before generating fresh lab sessions.' : 'Could not create the local .env. Check directory permissions.');
  process.exitCode = 1;
}
