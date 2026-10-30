const encoder = new TextEncoder();
const encode = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decode = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
const keyFor = secret => crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export async function issueSession(secret, target, user, now = Math.floor(Date.now() / 1000)) {
  const body = encode(encoder.encode(JSON.stringify({ target, user, iat: now, exp: now + 900, id: crypto.randomUUID() })));
  const signature = await crypto.subtle.sign('HMAC', await keyFor(secret), encoder.encode(body));
  return `${body}.${encode(new Uint8Array(signature))}`;
}

export async function verifySession(token, secret, target, now = Math.floor(Date.now() / 1000)) {
  try {
    if (typeof token !== 'string' || token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
    const [body, signature] = token.split('.');
    if (!await crypto.subtle.verify('HMAC', await keyFor(secret), decode(signature), encoder.encode(body))) return null;
    const value = JSON.parse(new TextDecoder().decode(decode(body)));
    if (value.target !== target || typeof value.user !== 'string' || !value.user ||
        !Number.isInteger(value.iat) || !Number.isInteger(value.exp) || value.iat > now ||
        value.exp <= now || value.exp - value.iat !== 900 || typeof value.id !== 'string') return null;
    return value;
  } catch { return null; }
}
