# reShapr UI Control

**Purpose:** web UI overlay for [reShapr](https://reshapr.io/) — a browser console for the control plane (same REST surface as the CLI).

**Stack:** SvelteKit (SPA) · Tailwind CSS · [shadcn-svelte](https://www.shadcn-svelte.com/)

## Prerequisites

- Reshapr control plane reachable (e.g. `http://localhost:5555`).
- CORS: set `RESHAPR_HTTP_CORS_ORIGINS` on the Quarkus server to include this app’s origin (e.g. `http://localhost:5173`). See the **reshapr** repo (`docs/WEB_UI.md`).

## Getting started

```bash
npm install
cp .env.example .env   # optional
npm run dev
```

Open the URL printed by Vite (often `http://localhost:5173`), enter the control plane URL, then **on-premises** credentials (`POST /auth/login/reshapr`).

In development, leave the URL empty to use the Vite proxy (`/api`, `/auth` → `localhost:5555`).

**SaaS** (`try.reshapr.io`) is not supported — use an on-premises control plane URL only.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Static production build (`build/`) |
| `npm run preview` | Preview production build |
| `npm run check` | Typecheck (svelte-check) |
| `npm run test` | Unit tests (Vitest) |

## Navigation (summary)

After sign-in:

- **Dashboard**, **Services** (per-service hub with artifacts, plans, expositions, MCP tools/prompts), **Account**
- **Administration** — only for platform admins (JWT role or `PUBLIC_RESHAPR_PLATFORM_ADMIN_USERNAMES`)
- **Experimental** — import/attach, global plan/expo/MCP flows, secrets, gateways, quotas, API tokens

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for routes and APIs.

## Environment

| Variable | Role |
|----------|------|
| `PUBLIC_RESHAPR_SERVER` | Default control plane URL (optional; user can override at sign-in) |
| `PUBLIC_RESHAPR_PLATFORM_ADMIN_USERNAMES` | Optional interim admin menu (comma-separated usernames, e.g. `admin`) |

Copy [`.env.example`](./.env.example) for local overrides.

## Documentation

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — setup, layout, conventions, PR checklist
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — auth, env, UI shell, MVP scope
- [`docs/README.md`](./docs/README.md) — full doc index
