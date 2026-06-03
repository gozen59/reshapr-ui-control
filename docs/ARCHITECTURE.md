# reShapr UI Control — architecture

**Index**: see [`docs/README.md`](./README.md) for the full list of transferred documents (chat, plan, rules, WEB_UI, CORS).

## Relationship to reshapr and try.reshapr.io

| Repo | Role |
|------|------|
| [reshapr](https://github.com/reshaprio/reshapr) | Quarkus **control plane** + CLI — source of REST APIs used by this UI |
| [try.reshapr.io](https://github.com/lbroudoux/try.reshapr.io) (prod: https://try.reshapr.io ; local: `GOZEN/TOOLS/try.reshapr.io`) | SaaS **portal** — look & feel reference (OKLCH theme, login card, footer, `AppBrand` typography) |

This project is a **static SPA** (`adapter-static`, `ssr: false`). It does not embed try’s server stack (Auth.js, Drizzle, `adapter-node`). It calls an external control plane from the browser (or via the Vite dev proxy).

## Environment variables (Vite)

| Variable | Role |
|----------|------|
| `PUBLIC_RESHAPR_SERVER` | Default control plane URL in the UI (e.g. `http://localhost:5555`). The user can change it before signing in. In dev, if unset, the Vite proxy serves `/api` and `/auth`. |
| `PUBLIC_RESHAPR_PLATFORM_ADMIN_USERNAMES` | Optional comma-separated usernames that may see the **Administration** sidebar (interim on-prem until the control plane issues `platform-admin` JWT groups). Example: `admin`. |

## Authentication

- **On-premises only**: `POST {server}/auth/login/reshapr` → token + server URL in `sessionStorage`. In dev, an empty control plane URL uses the Vite proxy to `http://localhost:5555`.
- **SaaS** (`try.reshapr.io`, mode `saas`): not supported in this UI — use a self-hosted control plane URL.

Server-side CORS on the control plane: `RESHAPR_HTTP_CORS_ORIGINS` (see [`docs/reshapr-control-plane-CORS.md`](./reshapr-control-plane-CORS.md)).

## Product releases (navigation)

### Release 1 (supported)

Main sidebar (not under Experimental):

| Screen | Route | APIs / data |
|--------|-------|-------------|
| Dashboard | `/` | Aggregated `/api/v1/*` stats (org-scoped) |
| Services list | `/services` | `GET /api/v1/services` |
| Service hub | `/services/[id]` and sub-routes below | Per-service aggregation (`src/lib/serviceHub.ts`) |
| Account | `/account` | JWT claims from session token (no `/api/v1/me` yet) |

**Service hub** (`src/routes/(app)/services/[id]/`): horizontal sub-nav + overview dashboard. Each service exposes:

| Sub-route | Content |
|-----------|---------|
| `/services/[id]` | Overview cards (counts) + collapsible raw service JSON |
| `/services/[id]/artifacts` | `GET /api/v1/artifacts/service/{id}` |
| `/services/[id]/plans` | Configuration plans filtered by `serviceId` |
| `/services/[id]/expositions` | Active / all expositions for the service |
| `/services/[id]/mcp-custom-tools` | Resolved tools (`src/lib/mcpCustomTools.ts`) |
| `/services/[id]/mcp-prompts` | Resolved prompts (`src/lib/mcpPrompts.ts`); empty list if no `RESHAPR_PROMPTS` artifact (no error banner) |

Import, attach, plan create, and global MCP URL pickers remain under **Experimental**; service sub-pages link there when needed.

- **Sign-in**: on-prem `POST /auth/login/reshapr` (username/password).
- **Session**: token + control plane URL in `sessionStorage`; profile via `src/lib/auth/jwtClaims.ts` (display-only, no signature verification).
- **Header**: signed-in username when available; bootstrap `mode` refreshed on app load if a token exists.
- **Administration** (sidebar): only for platform admins — JWT groups/roles (`platform-admin`, `platform_admin`, `admin`) or `PUBLIC_RESHAPR_PLATFORM_ADMIN_USERNAMES`. Routes `/admin/organizations`, `/admin/users` are placeholders until upstream list APIs exist.

### Experimental

Collapsible **Experimental** section — advanced operator flows (unchanged behavior):

- Artifacts, configuration plans, expositions, MCP custom tools, MCP prompts, secrets, gateway groups, quotas, API tokens.

### Release 2 (planned, blocked upstream)

- OIDC / external IDP sign-in for platform admins (see [`issue-admin-api-platform-dashboard.md`](./issue-admin-api-platform-dashboard.md)).
- Platform **organizations** and **users** lists for admins — placeholder routes under `/admin/*` until tenant-safe APIs exist.

## MVP scope (API surface)

- **P0**: bootstrap on login, services, import / attach artifacts, plans, expositions (active list + all + create + detail + delete).
- **P1**: secrets, gateway groups, quotas, API tokens.
- **MCP**: custom tools (control-plane REST), prompts (control-plane `RESHAPR_PROMPTS` artifact).
- **Dashboard**: home stats aggregated from existing `/api/v1/*` only (no control-plane patches).

## Key libraries (UI)

| Module | Role |
|--------|------|
| `src/lib/api/client.ts` | Bearer client for `/api/v1/*`, bootstrap, login |
| `src/lib/stores/auth.svelte.ts` | Session, bootstrap, `userClaims`, `isPlatformAdmin` |
| `src/lib/auth/jwtClaims.ts` | Parse JWT payload for Account / admin gating |
| `src/lib/serviceHub.ts` | Service overview counts and filters |
| `src/lib/serviceContext.ts` | Layout context for `/services/[id]/*` |
| `src/lib/mcpCustomTools.ts`, `src/lib/mcpPrompts.ts` | MCP resolution by URL or by `serviceId` |

## UI shell and theme (aligned with try.reshapr.io)

- **Root layout** (`src/routes/+layout.svelte`): full-height column, `bg-background`, global `AppFooter` (same pattern as try).
- **App layout** (`src/routes/(app)/+layout.svelte`): light header (`bg-card`), light sidebar (`bg-sidebar` tokens), nav active state `bg-primary/10`, main content `max-w-6xl`.
- **Theme** (`src/app.css`): OKLCH slate + teal primary — same token set as try; light shell by default (no split dark sidebar scope).
- **Branding** (`AppBrand`): horizontal logo + **UI Control** in header; login variant matches try’s title + icon pattern.
- **Login** (`src/routes/login/*`): centered `rounded-xl border bg-card p-8 shadow-lg` card.

## Control plane boundary

Do not add or modify Quarkus resources in reshapr from this repo. If a feature needs a missing `/api/v1/*` endpoint, document the gap for the reshapr team; use client-side aggregation or partial UI until upstream exposes an API.
