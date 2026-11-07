## Crafted flow (CVE-2025-29927), v14.2.24 - corrected

Client sends request with header:
  x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware
  (the value must equal params.name - the middleware's internal name -
  repeated 5 times, colon-separated; a single occurrence is not enough)

  -> sandbox.ts:86-91 splits header on ':', counts entries equal to params.name
  -> count reaches MAX_RECURSION_DEPTH (5) -> depth >= 5 is true
  -> sandbox.ts:94-101 returns early with 'x-middleware-next': '1',
     the middleware body never executes
  -> route handler receives the request with no auth check having occurred
  -> protected content returned

## Negative control (v14.2.24)

Same request, header value = "middleware" (single occurrence, count = 1)
  -> depth (1) < MAX_RECURSION_DEPTH (5) -> condition false
  -> middleware executes normally -> auth check enforced

## Reviewer's independent lab observations (v14.2.24, NOT run by M3's runner)

| Header value | /lab/vulnerable/dashboard | /lab/vulnerable/api/records |
|---|---|---|
| `middleware` (count=1) | 307 (redirect, denied) | 401 (unauthorized) |
| `middleware:middleware:middleware:middleware:middleware` (count=5) | 200 + protected marker | 200 + protected marker |

These are the reviewer's own spot-check results, recorded here as the
condition M3's runner must reproduce - not results from M3's runner itself.

## Same request against v14.2.25 (patched)

Client sends request with the 5x-repeated header value, but supplies no
valid x-middleware-subrequest-id (the server's per-boot secret is not
disclosed to this request).
  -> filterInternalHeaders checks x-middleware-subrequest-id against the
     server's own secret -> mismatch (or missing)
  -> x-middleware-subrequest header is deleted
  -> sandbox.ts's check sees no valid header, regardless of repetition count
  -> Middleware runs normally -> auth check enforced

For the fixed CVE-2025-29927 request used in this lab, no valid
server-issued identifier is supplied, so 14.2.25 removes the forged
header and the bypass fails. This is narrower than a claim that the
identifier can never be exposed under any circumstance.

Note: this diagram describes the CVE-2025-29927 bypass path and its fix
only. It does not address CVE-2025-30218 (a separate, low-severity
id-leakage issue also present in 14.2.25), which was out of scope for
this lab and not tested here. See source-map.md for details.

## Deployment paths vs. shared-source contract

The shared-source contract (this repo's app code) defines:
- /lab/vulnerable/dashboard
- /lab/vulnerable/api/records

The current operator-gated preparation web additionally maps:
- /1 -> the original (vulnerable) app, with direct routes
  /1/dashboard and /1/api/records
- /2 -> the historical patched app, with direct routes
  /2/dashboard and /2/api/records

## Public demo deployment

The active public demo exposes two Next.js targets behind a private
operator gate, reached via a demo.py terminal flow:
- /1 - Next.js 14.2.24 (vulnerable baseline)
- /2 - Next.js 14.2.25 (patched)

Each target has /dashboard and /api/records routes. After the operator
gate, the gateway deliberately forwards the exact five-name
x-middleware-subrequest value on GET requests to all four routes
(/1/dashboard, /1/api/records, /2/dashboard, /2/api/records) - it does
not strip every reproduction header. A single-name header is rejected by
the gateway itself with 400, before the request reaches either Next.js
target; that 400 is a gateway rejection, not evidence that the
application's depth-five condition was evaluated.

The outer operator authentication (the gate itself) is separate from
each application's own signed session - a successful gate login does not
imply a valid app session, and vice versa.

/lab/vulnerable and /lab/vulnerable/api/records (as used elsewhere in
this document) are the shared-source contract's route naming, used when
discussing the application code directly. They are not the URL of the
current hosted demo; the current demo's actual public paths are /1 and
/2 as described above.

Full four-target evaluation, including single-name and other threshold
controls, should use the fixed internal runner against direct targets,
not the public gateway, and must not expose target ports or share
credentials.
Operator authentication on the gateway and the target application's own session
are separate concerns and must not be conflated.

## M2 -> M3 handoff

**Active runner scenario IDs** (current implementation, applied to
dashboard and records across all four targets):
- anonymous-normal
- anonymous-cve
- negative-control (sends `not-a-middleware-name`, not a single
  repetition of the real middleware name)
- valid-session
- invalid-session
- cross-target-session

**Additional threshold check (supplementary, not the active
negative-control implementation):**
A single-occurrence header using the real middleware name (e.g.
`x-middleware-subrequest: middleware`) is a useful extra boundary test
distinct from the active negative-control scenario's `not-a-middleware-name`
value. On isolated copies of the current images, this single-name
control reached /1 and returned 307 on /dashboard and 401 on
/api/records; the five-name request returned the protected marker on
both routes. These are reviewer-run results on isolated copies, not
M2 or M3 runs of the existing demo.

The descriptive scenario names used elsewhere in this document (e.g.
"anonymous-cve-negative", "anonymous-cve-positive") are proposed,
illustrative names and map onto the active IDs above
(anonymous-cve-negative -> negative-control; anonymous-cve-positive ->
anonymous-cve). They are not a separate implementation requirement.

M2/M3 have not executed the active runner's scenarios against the
deployed demo. The reviewer's fresh run against isolated copies of the
exact deployed target images completed 48/48 expected rows; this is
reviewer evidence, not M2 or M3 acceptance.

**Negative control (required):**
x-middleware-subrequest: middleware   (single occurrence)
Expected: 307 on /dashboard, 401 on /api/records, no protected marker -
this proves the scenario tests the 5-repetition condition specifically,
not just "any header present."

**Scenario definitions to add/update in the runner:**
- anonymous-cve-negative: single-occurrence header -> expect denial
- anonymous-cve-positive: 5x-repeated header -> expect marker present
