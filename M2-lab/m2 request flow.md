# Request Flow: Normal vs Crafted

## Normal flow
Client request
  → Next.js receives request
  → Middleware executes (checks session/auth)
  → If unauthorized: redirect / deny
  → If authorized: pass through to route handler
  → Route handler returns page

## Crafted flow (CVE-2025-29927)
Client request + `x-middleware-subrequest` header (value is version-specific)
  → Next.js receives request
  → Server checks the header value, treats request as an internal subrequest
  → Middleware is SKIPPED entirely — no auth check runs
  → Route handler executes directly
  → Protected content returned, regardless of actual auth state

## Key point
The gap is not "the header is dangerous." The gap is that the server treats
an externally-controllable value as proof of internal, trusted origin, with
nothing to verify that claim.

[TODO: insert exact file/line reference once traced from source, per source-map.md]
