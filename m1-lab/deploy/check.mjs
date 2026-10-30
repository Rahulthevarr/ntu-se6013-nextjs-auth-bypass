import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const values = Object.fromEntries(readFileSync(root + '.env', 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)]; }));
const tests = readdirSync(root + 'tests').filter(file => file.endsWith('.test.mjs')).map(file => root + 'tests/' + file);
const result = spawnSync(process.execPath, ['--experimental-global-webcrypto', '--test', ...tests], { stdio: 'inherit', env: { ...process.env, ...values, LAB_TEST_ORIGIN: values.LAB_PUBLIC_ORIGIN }, cwd: root });
process.exitCode = result.status ?? 1;
