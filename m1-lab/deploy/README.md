# Deployment handoff, not a public rollout

The supplied Compose file is for a local isolated lab. No DNS, HTTPS route, host systemd unit, reverse proxy, firewall rule or public service is provisioned by this contribution.

## Current boundary

Only the control plane publishes a port, on `127.0.0.1:4317` by default. The vulnerable service has no published host port. It belongs only to an internal bridge with `gateway_mode_ipv4: isolated`, so that bridge has no host gateway address. The control plane also joins a normal edge bridge for its loopback-published port. The target does not join that edge network.

Both runtime containers run as non-root, with a read-only root filesystem, bounded tmpfs, all capabilities dropped and `no-new-privileges`. CPU, memory, process and HTTP limits are explicit in the source. No runtime host bind mount, Docker socket, privileged mode, host networking or production credential is used.

The browser gateway exposes named example-application routes only. It does not accept arbitrary upstream destinations. The target-to-control network link is not a replacement for control-plane authentication. Do not broaden the gateway into an unrestricted proxy.

## Configuration

Run `node deploy/init-env.mjs` once from `m1-lab/`. This creates a gitignored `.env`, refuses replacement and uses restrictive file permissions where the host supports them.

- `CONTROL_USER`, `CONTROL_PASSWORD`: independent operator gate, never forwarded to the target. Operator password must be at least 24 characters.
- `LAB_USER`, `LAB_PASSWORD`: disposable fictional target account. Target password must be at least 16 characters.
- `LAB_SESSION_SECRET`: target-only HMAC key, at least 32 characters, generated from 32 random bytes.
- `LAB_PUBLIC_ORIGIN`: exact browser origin, including port; rejects another Host and cross-origin forms.
- `LAB_PORT`: loopback host port, default `4317`.
- `COOKIE_SECURE`: `false` for this local HTTP-only lab. Set `true` for any separately approved HTTPS route.

If the port is occupied, change BOTH `LAB_PORT` and `LAB_PUBLIC_ORIGIN` before starting. Do not edit a global proxy or kill another service to free the port. Use the exact configured origin in the browser, not `localhost` when the configured origin uses `127.0.0.1`.

Operator Basic Auth travels only over loopback HTTP in the current setup. A future team route requires HTTPS and its own reviewed access boundary. It must not expose vulnerable targets directly or rely on their middleware to protect the control plane. Keep per-target session keys/cookie paths separate when adding M4 profiles. Do not share a live environment file through Git or chat.

## Start and observe

```sh
cd m1-lab
node deploy/init-env.mjs
docker compose config --quiet
docker compose up --build -d --wait
```

Open the configured origin. Read operator credentials locally from `.env`; use the separate target credentials inside the example app.

```sh
docker compose ps
docker compose logs --tail=50
node deploy/check.mjs
```

Do not paste `docker compose config`, `docker inspect` environment output, request cookies or `.env` contents into shared evidence. The quiet config check avoids printing substituted secrets.

## Shutdown and reset

```sh
docker compose down --remove-orphans
```

This stops only the named Compose project and removes its networks. No data volume is created by M1. It does not stop production services. Build images and caches remain until deliberately removed; do not run a machine-wide prune.

To invalidate outstanding target sessions, first stop the lab, preserve the private environment file if needed, then deliberately regenerate the local environment and restart. The generator refuses an existing `.env`; moving that file aside is an explicit operator choice. Never retain that backup in the shared repository.

## Rollback

Stop this lab first. Restore the previously reviewed branch/commit in a clean checkout, keep the matching private local environment, rebuild and start the same Compose project. Do not use `git reset --hard` over another member's work. Re-run health, anonymous denial, valid login/logout and browser checks after any rollback. There is no approved earlier deployed version to roll back to in this initial contribution.

## Separate public-deployment gate

Before a future rollout: obtain the owner's exact approval for hostname/access/configuration; discover actual host ports and capacity; review the diff; keep targets private and unable to reach host management/production services; enable trusted TLS and secure cookies; test operator authentication and same-origin protections; repeat the actual browser flows from the intended team URL; and retain a concrete shutdown/rollback route. Public DNS, trusted HTTPS, external-user reachability and native Windows/iPhone operation are not established by the local Linux tests.
