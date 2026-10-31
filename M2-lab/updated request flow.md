## Crafted flow (CVE-2025-29927), v14.2.24

Client sends request + `x-middleware-subrequest: <guessable value>`
  → sandbox.ts:86 reads the header value
  → No check on whether this came from Next.js itself or an external client
  → Treated as internal subrequest → middleware skipped
  → Route handler runs directly, protected content returned

## Same request against v14.2.25 (patched)

Client sends request + `x-middleware-subrequest: <guessable value>`
  → server-ipc/utils.ts: filterInternalHeaders checks if this request
    originated from the current server session
  → Request did NOT originate internally → header is stripped
  → sandbox.ts:86 now sees no valid header
  → Middleware runs normally → auth check enforced
