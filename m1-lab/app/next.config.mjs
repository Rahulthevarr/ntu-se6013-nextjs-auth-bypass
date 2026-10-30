import path from 'node:path';
import { fileURLToPath } from 'node:url';
export default {
  basePath: '/lab/vulnerable',
  output: 'standalone',
  poweredByHeader: false,
  experimental: { cpus: 1, externalDir: true, outputFileTracingRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Cache-Control', value: 'no-store' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'same-origin' }
    ] }];
  }
};
