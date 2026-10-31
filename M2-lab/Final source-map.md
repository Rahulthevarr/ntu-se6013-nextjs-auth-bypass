# Source Map — CVE-2025-29927

## Vulnerable (v14.2.24)

**File:** `packages/next/src/server/web/sandbox/sandbox.ts`, line 86
```js
const subreq = params.request.headers[`x-middleware-subrequest`]
```
Reads the `x-middleware-subrequest` header directly from the incoming
request with no verification of its origin.

**File:** `packages/next/src/server/web/sandbox/context.ts`, lines 360-372
Where Next.js sets this header on its own legitimate internal subrequests —
the mechanism the bug abuses.

**Root problem:** any request carrying this header, from anyone, was
treated as proof of trusted internal origin. There was no secret or check
tying the header to an actual internal request.

## Patched (v14.2.25)

**File:** `packages/next/src/server/lib/router-server.ts`, ~line 149-155
On server startup, generates a random 8-byte secret using
`crypto.getRandomValues` and stores it process-wide:
```js
const middlewareSubrequestId = Buffer.from(randomBytes).toString('hex')
;(globalThis as any)[Symbol.for('@next/middleware-subrequest-id')] =
  middlewareSubrequestId
```

**File:** `packages/next/src/server/web/sandbox/context.ts`, ~line 368-371
When Next.js makes a genuine internal subrequest, it now also stamps it
with `x-middleware-subrequest-id`, set to the server's own secret.

**File:** `packages/next/src/server/lib/server-ipc/utils.ts`, lines 57-72
`filterInternalHeaders` now checks whether the incoming
`x-middleware-subrequest-id` matches the server's own secret:
```js
if (header === 'x-middleware-subrequest' &&
  headers['x-middleware-subrequest-id'] !==
    (globalThis as any)[Symbol.for('@next/middleware-subrequest-id')]
) {
  delete headers['x-middleware-subrequest']
}
```
If it doesn't match (or is absent, as for any external attacker), the
original header is deleted before `sandbox.ts:86` ever reads it.

**What changed:** the fix adds an unforgeable, per-boot random secret that
only Next.js's own internal requests can know, and strips the original
header from any request that can't prove it holds that secret. This closes
the gap without removing the internal-subrequest mechanism itself.

**Causal chain confirmed:** `filterInternalHeaders` (server-ipc/utils.ts)
runs on the request before it reaches the sandbox's header check
(sandbox.ts:86), so a forged header never survives to be read in the
patched version.
