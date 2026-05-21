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

## Authentication

- **On-premises only**: `POST {server}/auth/login/reshapr` → token + server URL in `sessionStorage`. In dev, an empty control plane URL uses the Vite proxy to `http://localhost:5555`.
- **SaaS** (`try.reshapr.io`, mode `saas`): not supported in this UI — use a self-hosted control plane URL.

Server-side CORS on the control plane: `RESHAPR_HTTP_CORS_ORIGINS` (see [`docs/reshapr-control-plane-CORS.md`](./reshapr-control-plane-CORS.md)).

## MVP scope (implemented in navigation)

- **P0**: bootstrap on login, services, import / attach artifacts, plans, expositions (active list + all + create + detail + delete).
- **P1**: secrets, gateway groups, quotas, API tokens.
- **MCP**: custom tools (control-plane REST), prompts (control-plane `RESHAPR_PROMPTS` artifact).
- **Dashboard**: home stats aggregated from existing `/api/v1/*` only (no control-plane patches).

## UI shell and theme (aligned with try.reshapr.io)

- **Root layout** (`src/routes/+layout.svelte`): full-height column, `bg-background`, global `AppFooter` (same pattern as try).
- **App layout** (`src/routes/(app)/+layout.svelte`): light header (`bg-card`), light sidebar (`bg-sidebar` tokens), nav active state `bg-primary/10`, main content `max-w-6xl`.
- **Theme** (`src/app.css`): OKLCH slate + teal primary — same token set as try; light shell by default (no split dark sidebar scope).
- **Branding** (`AppBrand`): horizontal logo + **UI Control** in header; login variant matches try’s title + icon pattern.
- **Login** (`src/routes/login/*`): centered `rounded-xl border bg-card p-8 shadow-lg` card.

## Control plane boundary

Do not add or modify Quarkus resources in reshapr from this repo. If a feature needs a missing `/api/v1/*` endpoint, document the gap for the reshapr team; use client-side aggregation or partial UI until upstream exposes an API.
