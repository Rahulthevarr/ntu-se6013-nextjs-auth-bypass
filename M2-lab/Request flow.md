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
| `middleware:middleware:middleware:middleware:middleware`
