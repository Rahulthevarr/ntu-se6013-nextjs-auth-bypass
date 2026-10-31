## Crafted flow (CVE-2025-29927), v14.2.24

Client sends request + `x-middleware-subrequest: <any matching value>`
  → sandbox.ts:86 reads the header, no origin check
  → Treated as internal subrequest → middleware skipped
  → Route handler runs directly, protected content returned

## Same request against v14.2.25 (patched)

Client sends request + `x-middleware-subrequest: <value>`
  (attacker has no way to also supply a valid `x-middleware-subrequest-id`,
  since that secret is generated randomly per server boot and never
  exposed to clients)
  → filterInternalHeaders checks x-middleware-subrequest-id against the
    server's own secret → mismatch (or missing)
  → x-middleware-subrequest header is deleted
  → sandbox.ts:86 sees no valid header
  → Middleware runs normally → auth check enforced
