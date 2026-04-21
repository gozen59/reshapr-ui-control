# reshapr-ui-control architecture

**Index**: see [`docs/README.md`](./README.md) for the full list of transferred documents (chat, plan, rules, WEB_UI, CORS).

## Relationship to reshapr

- Quarkus control plane: **reshapr** repo (`control-plane/`, `cli/`).
- Server-side CORS configuration: `RESHAPR_HTTP_CORS_ORIGINS` + `application.properties` (see reshapr `docs/WEB_UI.md`).

## Environment variables (Vite)

| Variable | Role |
|----------|------|
| `VITE_RESHAPR_SERVER` | Default control plane URL in the UI (e.g. `http://localhost:5555`). The user can change it before signing in. |

## Authentication

- **On-premises**: `POST {server}/auth/login/reshapr` then store token + server URL in `sessionStorage`.
- **SaaS**: CLI OAuth flow not reproduced here; message on the login screen.

## MVP scope (implemented in navigation)

- **P0**: bootstrap on login, services, import / attach artifacts, plans, expositions (active list + all + create + detail + delete).
- **P1**: secrets, gateway groups, quotas, API tokens.
