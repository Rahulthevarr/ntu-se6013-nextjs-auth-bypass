# M2 Summary — Root Cause of CVE-2025-29927

## One-line description
An authorization bypass in Next.js middleware: a request carrying the
`x-middleware-subrequest` header is wrongly treated as an internal Next.js
subrequest, causing middleware (and any auth check inside it) to be skipped
entirely.

## Root cause
Next.js uses `x-middleware-subrequest` to mark its own internal subrequests
and avoid infinite middleware loops. In v14.2.24, the server read this
header with no check on where the request actually came from
(`sandbox.ts:86`). Any external client could set the same header value and
be treated as trusted internal traffic.

## The fix (v14.2.25)
Next.js now generates a random, per-boot secret (`middlewareSubrequestId`)
that only its own internal requests can know. Genuine internal subrequests
are stamped with a second header, `x-middleware-subrequest-id`, carrying
that secret. Before a request reaches the middleware-skip check,
`filterInternalHeaders` verifies the incoming `-id` matches the server's
secret; if it doesn't (as for any external attacker), the original
`x-middleware-subrequest` header is stripped. (See `source-map.md` for
exact file/line references and `request-flow.md` for the before/after
diagrams.)

## Why this matters — the principles
- **Authentication vs authorization:** this bypasses the authorization
  check, not identity verification.
- **Complete mediation:** the crafted request opened a second path to the
  route handler that never passed through the auth checkpoint at all.
- **Trusting client-supplied values:** the vulnerable code treated a
  header the client fully controls as proof of trusted internal origin,
  with nothing to actually verify the claim.

## Scope and limits
- Only affects middleware-based authorization on self-hosted deployments
  (Vercel-hosted apps were automatically protected).
- A bypass of middleware does not itself defeat an independent backend
  authorization check (see M4's server-auth profile).
- This report covers the 14.2.24 → 14.2.25 pair only; other affected major
  versions (11.x–13.x, 15.x) were not traced in this project.

## Sources
See `sources.md` for the full ledger. Primary: official GitHub advisory
(GHSA-f82v-jwr5-mffw), original researcher disclosure, Vercel postmortem.

## Handoffs
- **M3:** exact version (14.2.24), header name/value, target route
  (`/dashboard`), expected before/after behavior — see `request-flow.md`.
- **M4:** exact file/line references for the patch mechanism, for
  explaining the header-filter and server-auth defences.
- **M5:** claim list — advisory-stated facts vs. what this project has
  actually traced/verified itself (everything above is self-verified via
  source code, not just taken from the advisory).
