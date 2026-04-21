# Web UI and control-plane APIs (copy for the reshapr-ui-control workspace)

**Canonical source**: reshapr repo — `docs/WEB_UI.md`  
**Reference clone**: `/Users/tmathias/WORKSPACE/GOZEN/TOOLS/reshapr/`

Relative links to `../cli/` or `../control-plane/` in the original document refer to that **reshapr** root path.

---

# Web UI and control-plane APIs

This document captures architecture choices for a web UI consuming the same APIs as the CLI, the associated CORS configuration, and the recommended MVP scope.

## 1. Hosting and authentication (decision)

### Chosen option for micepe / remote SPA integration: **Option B — separate web application**

- The SPA (e.g. in **micepe** or **reshapr-ui-control**) is served on its own origin (domain / port).
- It calls the control plane via `fetch` over HTTPS using the same endpoints as the CLI (`/api/config`, `/auth/login/reshapr`, `/api/v1/...`).
- **Pros**: independent release cycle, free choice of front stack, no Quarkus JAR bloat.
- **Con**: requires an explicit list of allowed CORS origins on the control plane (see `application.properties` and `RESHAPR_HTTP_CORS_ORIGINS`).

### Alternative: **Option A — UI embedded in the control plane**

- Front build → static files under `control-plane/src/main/resources/META-INF/resources/`.
- **Pros**: same origin, no browser CORS, single deployment.
- **When to prefer it**: “appliance” distribution or no existing portal.

### MVP authentication strategy: **CLI alignment (Bearer in memory)**

- After `POST /auth/login/reshapr` (on-prem) or the SaaS OAuth flow, the SPA keeps the JWT (or token) **in memory** (or `sessionStorage`) and sends `Authorization: Bearer …` on `/api/v1/*`, like the CLI (`reshapr/cli/src/utils/config.ts`).
- **Recommended evolution**: a **BFF** (Backend-for-Frontend) or `HttpOnly` cookies if passwords must never reach the browser or XSS exposure on long-lived tokens should be reduced.

## 2. CORS and HTTP security

### Configuration

- Quarkus CORS filter is enabled (`quarkus.http.cors=true`).
- Allowed origins are driven by **`RESHAPR_HTTP_CORS_ORIGINS`** (comma-separated list). If unset, common **localhost** origins for SPA dev may apply (see `reshapr/control-plane/src/main/resources/application.properties`).
- **Production**: set `RESHAPR_HTTP_CORS_ORIGINS` explicitly to front-end origins only.

### Targeted review of sensitive routes

- **`/api/v1/*`**: annotated `@Authenticated`; access with Bearer JWT.
- **`/api/admin/*`**: protected by `@AdminAuthenticated` (admin API key), outside standard CLI usage.
- **`/api/config`**: public bootstrap (SaaS / on-prem mode, version).
- **`POST /auth/login/reshapr`**: on-prem authentication.
- **`quarkus.http.auth.proactive=false`**: lazy authentication.

Allowed CORS headers and methods include at least `Authorization`, `Content-Type`, and the verbs used by the CLI (GET, POST, PUT, PATCH, DELETE, OPTIONS).

## 3. MVP UI scope (screens and APIs)

Goal: cover “import → plan → expose” and day-to-day management, reusing the **same DTOs / paths** as the CLI.

| Priority | Screen or flow | Endpoints (relative to control plane URL) | CLI reference |
|----------|----------------|--------------------------------------------|---------------|
| P0 | Bootstrap / mode selection | `GET /api/config` | `login.ts`, `info.ts` |
| P0 | On-prem sign-in | `POST /auth/login/reshapr` | `login.ts` |
| P0 | Service list | `GET /api/v1/services` | `service.ts` |
| P0 | Service detail / delete | `GET/DELETE /api/v1/services/{id}` | `service.ts` |
| P0 | Import artifact | `POST /api/v1/artifacts` | `import.ts` |
| P0 | Attach artifact | `POST /api/v1/artifacts/attach` | `attach.ts` |
| P0 | Configuration plans | `GET/POST /api/v1/configurationPlans`, `GET/PUT/DELETE .../{id}`, `POST .../renewApiKey` | `import.ts`, `config.ts` |
| P0 | Expositions | `GET/POST /api/v1/expositions`, `GET/DELETE .../{id}`, `GET /api/v1/expositions/active`, `GET .../active/{id}` | `import.ts`, `expo.ts` |
| P1 | Secrets | `GET /api/v1/secrets/refs`, CRUD `/api/v1/secrets` | `secret.ts` |
| P1 | Gateway groups | `GET/POST /api/v1/gatewayGroups`, `DELETE .../{id}` | `gateway-group.ts` |
| P1 | Tenant quotas | `GET /api/v1/quotas` | `quotas.ts` |
| P1 | API tokens | `POST/GET /api/v1/tokens/apiTokens`, `DELETE .../{tokenId}` | `api-token.ts` |
| — | Outside console MVP | `reshapr run` / GitHub, local Docker | `run.ts`, `stop.ts`, `status.ts` |

### Outside console MVP

- Global admin (`/api/admin/*`, E2E setup).
- Local Reshapr container lifecycle (`run` / `stop` / `status`).

---

For the exhaustive list of paths used by the CLI, see also `docs/plans/api_cli_et_ui_web.md` and `fetch` calls under `reshapr/cli/src/commands/`.
