# M1 verification receipt

Verified locally on 27 October 2026. This is an implementation/self-review receipt, not an assessed report section, independent peer approval, CVE reproduction or public-deployment result.

## Execution environment

- Linux ARM64.
- Docker 29.6.1, Compose v5.3.1.
- Application/control runtime: Node v22.23.4 from the digest pinned in both Dockerfiles.
- Host setup/HTTP helpers also ran on Node v18.19.1 with the Web Crypto flag.
- Browser: Playwright 1.49.0, Chromium 131.0.6778.33.

## Real checks completed

- Production Docker build of the pinned Next.js 14.2.24 application and the independent Node control plane.
- `docker compose config --quiet`, real container startup and both healthy services.
- `node deploy/check.mjs`: 8 tests passed, 0 failed, 0 skipped. This comprises six session/gateway unit tests and two real-HTTP acceptance groups; groups contain multiple assertions.
- The public entry works in both canonical and slash-redirect form. Anonymous dashboard requests return a login redirect without the protected marker; invalid-session records requests return 401 without it.
- Wrong credentials issue no target cookie. Valid credentials issue an HttpOnly, SameSite=Strict, target-path-scoped signed cookie, and return the fictional dashboard/records marker. Logout deletes the browser cookie; revisiting normally without it is denied.
- Independent operator authentication is required for the panel API and browser application path. Unknown proxy/target/application routes are rejected. Hostile form origins are rejected.
- Browser clicks exercised the public page, dashboard denial, wrong login, valid login, records JSON, public-page return, logout, new-tab application link, every target selector and health retry.
- The three uninstalled M4 targets remain not installed, without invented versions or experiment results. All experiment status stays `Not run`.
- A real fetched health response was temporarily held in the browser test to observe pending text and disabled duplicate submission, then released unchanged. A separately aborted client request showed unavailable state and keyboard retry recovered real health.
- A genuinely stopped target produced unavailable health, an unknown version, hidden application and an enabled retry control. This was repeated from the clean copy.
- Responsive checks at 320, 375, 768, 1024 and 1440 CSS pixels passed without page-level horizontal overflow. The embedded target fits vertically after real resize events rather than clipping its final paragraph.
- The 375px target also passed empty-required-field validation, keyboard login, fictional dashboard access, minimum 44px controls and logout. The panel reflowed with body text resized from 16px to 32px and with reduced motion.
- The final browser run recorded no page errors or unexpected console errors.
- Fourteen declared text/control colour pairs were calculated. The lowest tested normal-text ratio was 7.081:1; tested control boundaries exceeded 3:1. Screenshot review confirmed the repaired mobile paragraph is fully visible and controls/text are not visibly clipped.

## Clean-source repeat

A separate source copy was made without the original environment file, dependencies or generated runtime artifacts. It generated fresh independent credentials, built/started a separately named Compose project and repeated all 8 HTTP/unit tests plus the full browser flow and genuine stopped-target check. Docker build caching was allowed; this is not a claim of a fresh registry download. No original running container or original target session was required.

## Container boundary readback

The running vulnerable target had user `node`, a read-only root, no host mounts, no published target port and only the isolated internal network. Its route table had no default route/gateway. Bounded TCP connection attempts to a public address and the metadata-address range returned `ENETUNREACH`; no metadata HTTP response or credential was requested. The panel alone had a loopback binding on 127.0.0.1:4317. CPU/memory/process bounds and dropped capabilities are explicit in Compose.

Both source and clean-copy Compose projects were shut down and their containers/networks removed after verification. Build images/cache remain. No public site or production host configuration was changed.

## Resolved implementation defects

- Next.js 14's tracing-root option was moved to its actual experimental configuration location, and the standalone runtime path was verified by startup.
- Docker's internal-only control network did not actually publish its requested host port. A separate control-only edge network fixed reachability while keeping the vulnerable target isolated.
- The framework's canonical base-path redirect was missing from the browser allowlist. Both entry forms now have regression coverage.
- A real browser form sent Origin `null` under the no-referrer policy, despite a scripted HTTP login passing. A same-origin-compatible referrer policy fixed the form without accepting null/hostile origins.
- The initial fixed-height iframe clipped mobile text. Intrinsic body sizing after navigation/resize replaced that fixed presentation, and a vertical-fit assertion plus final screenshot review passed.

## Delivery gate

- Scope PASS: only the M1 baseline/shared shell/package is implemented; M3/M4/M5 work remains explicitly separate.
- Hard gates PASS: real health and fictional-data labels, no invented experiment measurements/assets/testimonials, no dead controls, and browser-tested loading/error/empty states. No theme toggle or dialog is shipped.
- Functionality PASS: the actual application, all panel selectors/links/forms and health retry were exercised; the genuine stopped-target case remained truthful.
- Mobile PASS: five measured widths, no page-level horizontal overflow, repaired vertical iframe fit and final mobile screenshot review.
- Accessibility PASS: measured contrast, minimum control sizes, visible keyboard focus, keyboard login/retry and actual 200-percent panel text reflow. Physical-device accessibility is not claimed.
- Purpose and liveliness PASS: the written DESIGN direction sets ENERGY 1 / RHYTHM 2 / MOTION 1; contrasting panel/target surfaces, target-first hierarchy, restrained teal actions and system typography each have a stated purpose. No decorative assets or idle animation.
- Runtime and source integrity PASS: real production build, HTTP/browser execution, clean-copy repeat, actual-secret scan and named-project cleanup. This remains self-review, not independent approval or public rollout.

## Scope and outstanding gates

No CVE-specific attack was executed by this M1 check. No patched/header-filter/server-auth target, experiment runner/exporter or final independent M5 evaluation is claimed. Stateless logout does not revoke a copied token before expiry/key rotation. Native Windows/macOS/iPhone and public DNS/HTTPS/team access remain unverified.

## Historical publication context

The following paragraphs describe the original 27 October publication, not the current repository's merge state.

The live upstream gained only an empty M2 document placeholder during implementation. The M1 branch was fast-forwarded to upstream base `1f94fefc6527baa917186c641b57a86cafc1ddde`, preserving that file; application/control source bytes remained unchanged from the clean-copy run. The earlier React2Shell overview remains untouched and is labelled historical in the root README.

The owner approved publishing the M1 branch and opening a pull request on 27 October 2026. This receipt records the local checks performed before publication; the GitHub PR records the published revision. M2/M3 peer review, merge, public deployment and formal submission remain separate gates. Publication does not authorise merging or deployment.

## Import into the current repository

The owner separately authorised importing M1 and integrating it into `main` of `sodiptabadiabanurea/ntu-se6013-nextjs-auth-bypass`. Only `m1-lab/` and `docs/contracts.md` were copied from M1 source commit `18037176880bff6a954fcc382f3b5f1dcc784eac`; the old private Git history and other members' files were not imported. Runtime and contract bytes are unchanged. README and receipt wording were adapted for the current repository.

Import validation reran all six session/gateway unit tests and all fourteen repository identity-gate tests successfully. The eleven `.mjs` modules passed Node syntax checks. Compose configuration passed using `.env.example` placeholders without creating or copying private credentials. These import checks did not rebuild/start containers or rerun the historical HTTP/browser acceptance above. No public service was deployed.
