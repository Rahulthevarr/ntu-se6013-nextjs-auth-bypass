const base = '/lab/vulnerable';
export function allowedRoute(path, method) {
  if (path.includes('..') || path.includes('%') || path.includes('\\')) return false;
  if (method === 'POST') return [`${base}/api/login`, `${base}/api/logout`].includes(path);
  if (!['GET', 'HEAD'].includes(method)) return false;
  return ['', '/', '/login', '/dashboard', '/api/records', '/api/health'].some(p => path === base + p) ||
    /^\/lab\/vulnerable\/_next\/static\/[A-Za-z0-9_./-]+\.(js|css|woff2?)$/.test(path);
}

export async function boundedBytes(stream, limit) {
  if (!stream) return Buffer.alloc(0);
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > limit) throw new Error('Response or request exceeds the lab byte limit.');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function targetCookie(header = '') {
  return header.split(';').map(value => value.trim()).filter(value => /^lab_vulnerable_session=[A-Za-z0-9_.-]*$/.test(value)).slice(0, 1).join('; ');
}
