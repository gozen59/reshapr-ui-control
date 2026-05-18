# reShapr UI Control — architecture

**Index**: see [`docs/README.md`](./README.md) for the full list of transferred documents (chat, plan, rules, WEB_UI, CORS).

## Relationship to reshapr

- Quarkus control plane: **reshapr** repo (`control-plane/`, `cli/`).
- Server-side CORS configuration: `RESHAPR_HTTP_CORS_ORIGINS` + `application.properties` (see reshapr `docs/WEB_UI.md`).

## Environment variables (Vite)

| Variable | Role |
|----------|------|
| `PUBLIC_RESHAPR_SERVER` | Default control plane URL in the UI (e.g. `http://localhost:5555`). The user can change it before signing in. In dev, if unset, the Vite proxy serves `/api` and `/auth`. |

## Authentication

- **On-premises**: `POST {server}/auth/login/reshapr` then store token + server URL in `sessionStorage`.
- **SaaS**: CLI OAuth flow not reproduced here; message on the login screen.

## MVP scope (implemented in navigation)

- **P0**: bootstrap on login, services, import / attach artifacts, plans, expositions (active list + all + create + detail + delete).
- **P1**: secrets, gateway groups, quotas, API tokens.
- **MCP**: custom tools (control-plane REST), prompts (JSON-RPC on MCP URL; CORS on MCP gateway).

## UI shell and theme

- **Layout**: top banner (app title + mode badge + server URL + Logout) + left sidebar (nav) + main content area.
- **Theme**: split — banner and sidebar use a local `.dark` scope (`bg-sidebar`, sidebar tokens); main content uses light `:root` tokens (`bg-background`, shadcn components).
- **Global**: no `class="dark"` on `<html>`; see `src/routes/(app)/+layout.svelte` and `src/app.css`.
