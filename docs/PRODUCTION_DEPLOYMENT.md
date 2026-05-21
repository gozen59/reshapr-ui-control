# Production deployment — CORS and proxy (on-premises UI)

This document captures deployment options for **reshapr-ui-control** when the SPA is served separately from the control plane (Option B). It complements [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`reshapr-control-plane-CORS.md`](./reshapr-control-plane-CORS.md).

## Context

- The UI is a static SPA (`npm run build` → `build/`).
- API calls use `fetch` with `Authorization: Bearer <token>` (same as the [reshapr CLI](https://github.com/reshaprio/reshapr)).
- **Development**: Vite dev proxy (`vite-plugin-reshapr-dev-proxy.ts`) forwards `/api` and `/auth` to the control plane without browser CORS.
- **Production**: the browser enforces CORS on cross-origin requests, or you must use a **same-origin** reverse proxy.

## Authentication (on-premises only)

This UI signs in with `POST /auth/login/reshapr` (username / password) against a **self-hosted** control plane (`GET /api/config` → `mode: on-premises`).

SaaS hosts such as `https://try.reshapr.io` are not supported (no browser OAuth in this app).

| Host | Typical use |
|------|-------------|
| `http://localhost:5555` | Local control plane (`reshapr run`) |
| `https://your-cp.example.com` | On-prem deployment behind your domain |

## Option 1 — CORS on the control plane

For a **self-hosted** Quarkus control plane, set:

```bash
RESHAPR_HTTP_CORS_ORIGINS=https://console.example.com
```

Multiple origins (comma-separated):

```bash
RESHAPR_HTTP_CORS_ORIGINS=https://console.example.com,https://console-staging.example.com
```

Reference (`reshapr` repo):

```properties
quarkus.http.cors=true
quarkus.http.cors.origins=${RESHAPR_HTTP_CORS_ORIGINS:...}
quarkus.http.cors.methods=GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS
quarkus.http.cors.headers=accept,accept-language,authorization,content-type,origin,x-requested-with
```

Verify:

```bash
curl -i -X OPTIONS "https://your-control-plane.example.com/api/config" \
  -H "Origin: https://console.example.com" \
  -H "Access-Control-Request-Method: GET"
```

Expect `Access-Control-Allow-Origin` matching your UI origin.

## Option 2 — Same-origin reverse proxy (recommended for production SPA)

Serve the UI and proxy API paths under **one origin** so the browser does not perform cross-origin calls.

```
https://console.example.com/           → static files (build/)
https://console.example.com/api/       → proxy → control plane
https://console.example.com/auth/      → proxy → control plane
```

### Example (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name console.example.com;

    root /var/www/reshapr-ui-control/build;
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass https://your-control-plane.example.com/api/;
        proxy_set_header Host your-control-plane.example.com;
        proxy_ssl_server_name on;
    }

    location /auth/ {
        proxy_pass https://your-control-plane.example.com/auth/;
        proxy_set_header Host your-control-plane.example.com;
        proxy_ssl_server_name on;
    }
}
```

### Vercel (static hosting + direct API + CORS)

Commit `vercel.json` so Vercel uses output directory **`build`** and SPA fallback (`index.html` for client routes). **No** `/api` or `/auth` rewrites on Vercel — the UI calls the control plane with **absolute URLs** (URL entered at login, stored in `sessionStorage`).

**Prerequisites**

1. **CORS** on your control plane: add your Vercel origin to `RESHAPR_HTTP_CORS_ORIGINS`.
2. **Login**: enter your on-premises control plane URL (e.g. `https://your-cp.example.com`).

**Optional Vercel build env**

| Variable | Role |
|----------|------|
| `PUBLIC_RESHAPR_SERVER` | Pre-fill the control plane URL on the login form |

For same-origin API on Vercel later, use Option 2 (reverse proxy) in front of both UI and API, or add `vercel.json` rewrites plus UI changes — not the default in this repo.

## Option 3 — UI embedded in the control plane (Option A)

Build the SPA into `control-plane/src/main/resources/META-INF/resources/` in the [reshapr](https://github.com/reshaprio/reshapr) repo.

- Same origin as the API — no CORS.
- Single deployment artifact.
- Less flexibility for independent UI releases.

See `docs/reshapr-WEB_UI.md` in the reshapr repository.

## Decision matrix

| Scenario | Suggested approach |
|----------|-------------------|
| Self-hosted control plane | CORS (`RESHAPR_HTTP_CORS_ORIGINS`) or reverse proxy |
| Your domain serves UI + proxied `/api` | Reverse proxy (Option 2) or Nginx |
| UI on **Vercel** | Static deploy (`vercel.json`) + **CORS** on the control plane |
| Appliance / single URL | Embedded UI (Option 3) |
| Local development | `npm run dev` + Vite proxy (already implemented) |

## Implemented in this UI (reference)

| Feature | Location |
|---------|----------|
| On-prem login | `POST /auth/login/reshapr` — [`src/routes/login/+page.svelte`](../src/routes/login/+page.svelte) |
| URL validation | `src/lib/auth/controlPlaneUrl.ts` |
| Dev CORS bypass | `vite-plugin-reshapr-dev-proxy.ts` |
| Vercel static deploy | `vercel.json` (SPA only; API via CORS) |

## Related links

- [reshapr — GitHub](https://github.com/reshaprio/reshapr)
- [reshapr-authentication-openapi-v0.1.yaml](https://github.com/reshaprio/reshapr/blob/main/reshapr-authentication-openapi-v0.1.yaml)
