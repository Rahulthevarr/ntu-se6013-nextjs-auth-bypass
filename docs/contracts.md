# M1 handoff contract

Active case: CVE-2025-29927. This is the implementation proposal from M1 for M3 and M4 to review, not evidence that every member has accepted an interface.

## Current application

- Installed target ID: `vulnerable`.
- Next.js: exactly `14.2.24`, from the lockfile and the running health identity.
- Profile: `middleware-only`. Session validation lives in `app/middleware.js`. The page and records handler deliberately do not add the independent M4 server-authorisation defence.
- Public target page: `/lab/vulnerable`.
- Login page: `/lab/vulnerable/login`.
- Protected page: `/lab/vulnerable/dashboard`.
- Protected data: `/lab/vulnerable/api/records`.
- Stable protected-content marker: `M1-FICTIONAL-RECORDS-ONLY`. It appears only in the protected page/data response, not in public target pages or the public health identity. The marker is an assertion aid, not a secret.
- Internal target address: `http://vulnerable:3000`, reachable by service name only on the isolated Compose network. No target host port is published.
- Private health: `GET /lab/vulnerable/api/health`. Returns actual `target`, `version`, `profile`, `ready` values; no credentials or session material.
- Login: `POST /lab/vulnerable/api/login`, URL-encoded `username` and `password`, same-origin form only. Success issues the signed target cookie and responds `303` to the dashboard; failure redirects to the login error state without issuing a cookie.
- Logout: same-origin `POST /lab/vulnerable/api/logout`. Deletes the current browser cookie. Stateless-token limitations are in the M1 README.
- Anonymous/invalid-session page request: `307` to the login page, without following redirects. Anonymous/invalid-session records request: `401` JSON without the protected marker.

The operator Basic Auth gate is independent of this target session. The browser gateway forwards only the target cookie, acceptable content headers and a validated form origin. It never forwards the operator Authorization header or framework-internal headers. It is NOT the experiment runner and must not be used to evaluate the CVE or attribute a defence. M3's fixed scenarios must address the private target directly. Otherwise the gateway's header omission can mask the experiment.

## Reserved target IDs and member ownership

- `vulnerable`: M1 application baseline, installed here.
- `patched`: M4 historical framework-patch comparison, not installed here.
- `header-filter`: M4 dedicated header-rejection boundary, not installed here.
- `server-auth`: M4 independent server-side authorisation, not installed here.

The panel lists the three uninstalled IDs honestly. No framework version or experiment measurement is invented for them. Before adding another target, M4 and M1 must agree its base path, cookie name/signing secret, identity endpoint and gateway/registry entry. Reuse the same fictional records and normal authentication logic; keep each added defence isolated.

## M3 extension boundary

M1 owns `m1-lab/control-ui/` and the shared gateway. M3 owns the future test runner and evidence components. Coordinate shared-file changes through a PR; do not copy a second independent shell.

Reserved fixed scenario IDs:

- `anonymous-normal`
- `anonymous-cve`
- `valid-session`
- `invalid-session`

M3 must accept a target ID and scenario ID from a fixed registry, never an arbitrary URL, path, command or header dictionary. Anonymous scenarios start without target cookies. Keep response bodies escaped, bound bytes/time/concurrency, and do not follow the initial redirect automatically.

Suggested evidence object (types and semantics, not an invented result):

- `schema_version`: string, initially `1`.
- `run_id`: freshly generated string; unique per execution.
- `started_at`: ISO UTC timestamp.
- `source_commit`: exact Git commit, or explicit `null` plus dirty/uncommitted state.
- `target`: object with target ID, observed Next.js version and observed profile.
- `scenario`: fixed scenario ID.
- `expected`: separately labelled planned assertion, never a measurement.
- `request`: method, fixed path and redacted relevant headers. No cookies, passwords or operator credentials.
- `response`: status, redirect location, bounded escaped body and truncation flag; `null` on transport failure.
- `observed`: `denied`, `protected-content-returned`, `error` or `inconclusive`.
- `elapsed_ms`: measured duration.
- `error`: safe explanation or `null`.
- `logs`: optional correlated evidence; absence is not proof that middleware was skipped.

A `200` alone is not a bypass assertion. Require the intended route and protected-content marker, and record unexpected responses without relabelling them as successful blocks.

Future retained exports belong under `evidence/<run-id>/`; compute an integrity hash over the actual exported bytes. No exporter or run store is implemented by M1. A future reset must clear only the selected target's local session/run state, never unrelated host or production state. Session-key rotation affects outstanding tokens for that target and must not rewrite exported historical run identities.

## Review order

M2 reviews M1's application/setup. M3 co-reviews this interface. M4 adds the historical patched target and separate defences. M5 independently repeats the integrated experiment. M1 self-tests do not replace those reviews or establish whole-project completion.
