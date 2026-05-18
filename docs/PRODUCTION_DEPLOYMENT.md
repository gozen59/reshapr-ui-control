# Production deployment — CORS, proxy, and SaaS auth

This document captures deployment options for **reshapr-ui-control** when the SPA is served separately from the control plane (Option B). It complements [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`reshapr-control-plane-CORS.md`](./reshapr-control-plane-CORS.md).

## Context

- The UI is a static SPA (`npm run build` → `build/`).
- API calls use `fetch` with `Authorization: Bearer <token>` (same as the [reshapr CLI](https://github.com/reshaprio/reshapr)).
- **Development**: Vite dev proxy (`vite-plugin-reshapr-dev-proxy.ts`) forwards `/api` and `/auth` to the control plane without browser CORS.
- **Production**: the browser enforces CORS on cross-origin requests, or you must use a **same-origin** reverse proxy.

## SaaS vs on-premises URLs

| Host | Role |
|------|------|
| `https://try.reshapr.io` | SaaS **portal** — bootstrap (`GET /api/config` → `mode: saas`), OAuth entry (`/cli/login`) |
| `https://app.try.reshapr.io` | Tenant **control plane** — REST API after OAuth (`ctrl_url` from callback) |
| `http://localhost:5555` | Local on-prem control plane (dev / `reshapr run`) |

After SaaS sign-in, the UI must store and use **`ctrl_url`** as the API base (not the portal URL). This matches `cli/src/commands/login.ts`.

On-premises sign-in uses `POST /auth/login/reshapr` with username and password.

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

### SaaS (`try.reshapr.io` / `app.try.reshapr.io`)

You cannot set `RESHAPR_HTTP_CORS_ORIGINS` on the public SaaS. Request that the Reshapr team allow your UI origin on:

- the portal (login / bootstrap), and
- the tenant API host (`app.try.reshapr.io` or your `ctrl_url`).

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
        proxy_pass https://app.try.reshapr.io/api/;
        proxy_set_header Host app.try.reshapr.io;
        proxy_ssl_server_name on;
    }

    location /auth/ {
        proxy_pass https://app.try.reshapr.io/auth/;
        proxy_set_header Host app.try.reshapr.io;
        proxy_ssl_server_name on;
    }
}
```

Replace `app.try.reshapr.io` with your on-prem control plane host when applicable.

### UI changes required (future work)

Today, production builds use the **absolute** API URL stored in `sessionStorage` after login. For a same-origin proxy:

1. Use **relative** paths (`/api/v1/...`, `/auth/...`) when the app is served behind the proxy.
2. Set SaaS `redirect_uri` to `https://console.example.com/login/callback`.
3. Optionally set `PUBLIC_RESHAPR_SERVER` empty or to the public console origin.

The dev proxy (`X-Reshapr-Control-Plane` header) is **dev-only**; do not rely on it in production.

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
| Your domain serves UI + proxied `/api` | Reverse proxy (Option 2) |
| Public SaaS only, no proxy | Ask Reshapr to allow your origin in CORS |
| Appliance / single URL | Embedded UI (Option 3) |
| Local development | `npm run dev` + Vite proxy (already implemented) |

## Implemented in this UI (reference)

| Feature | Location |
|---------|----------|
| On-prem login | `POST /auth/login/reshapr` — login form |
| SaaS OAuth | `Sign in with reShapr` → `/cli/login?redirect_uri=.../login/callback` |
| Callback handler | `src/routes/login/callback/+page.svelte` |
| URL validation | `src/lib/auth/controlPlaneUrl.ts` |
| Dev CORS bypass | `vite-plugin-reshapr-dev-proxy.ts` |

## Related links

- [reshapr — GitHub](https://github.com/reshaprio/reshapr)
- [reshapr-authentication-openapi-v0.1.yaml](https://github.com/reshaprio/reshapr/blob/main/reshapr-authentication-openapi-v0.1.yaml)
