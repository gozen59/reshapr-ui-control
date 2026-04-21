# Plan: APIs used by the CLI and feasibility of a web UI

This file mirrors the plan validated for the **reshapr** repo; the concrete console implementation lives in this repo (**reshapr-ui-control**).

## CLI network scope

- **Base URL**: `server` field in the CLI config (e.g. `https://try.reshapr.io`).
- **Authentication**: `Authorization: Bearer <token>` on `/api/v1/*`, except bootstrap and login.

## Endpoints called by the CLI (control plane)

| Area | Methods / paths (relative to `server`) | CLI files |
|------|------------------------------------------|-----------|
| Bootstrap | `GET /api/config` | `login.ts`, `info.ts` |
| On-prem auth | `POST /auth/login/reshapr` (JSON username/password; response body = token) | `login.ts` |
| SaaS auth | OAuth (local callback with `token`, `ctrl_url`) | `login.ts` |
| Artifacts | `POST /api/v1/artifacts`, `POST /api/v1/artifacts/attach` | `import.ts`, `attach.ts` |
| Plans | `GET/POST /api/v1/configurationPlans`, `GET/PUT/DELETE /api/v1/configurationPlans/{id}`, `POST .../renewApiKey` | `import.ts`, `config.ts` |
| Expositions | `GET/POST /api/v1/expositions`, `GET/DELETE /api/v1/expositions/{id}`, `GET /api/v1/expositions/active`, `GET .../active/{id}` | `import.ts`, `expo.ts` |
| Services | `GET /api/v1/services`, `GET/DELETE /api/v1/services/{id}` | `service.ts`, `config.ts` |
| Secrets | `GET /api/v1/secrets/refs`, CRUD `/api/v1/secrets` | `secret.ts` |
| Gateway groups | `GET/POST /api/v1/gatewayGroups`, `DELETE .../{id}` | `gateway-group.ts` |
| Quotas | `GET /api/v1/quotas` | `quotas.ts` |
| API tokens | `POST/GET /api/v1/tokens/apiTokens`, `DELETE .../{tokenId}` | `api-token.ts` |

**Outside the control plane**: `run.ts` (GitHub); **E2E**: `/api/admin/*`.

**No HTTP to control plane**: `stop`, `status` (local Docker).

## Web UI feasibility

Yes: reuse the same JSON APIs. Watch points: auth (on-prem vs SaaS), CORS (`RESHAPR_HTTP_CORS_ORIGINS` on the control plane), `reshapr.ctrl.public-url`.

## reshapr-ui-control repo

- Vite + React + TypeScript SPA, **Option B** (origin separate from the control plane).
- MVP auth: Bearer in `sessionStorage`, aligned with on-prem CLI.
- See `docs/ARCHITECTURE.md` for CORS and MVP scope screen by screen.
- **Context handoff**: all material (chat summary, full Cursor plan, rules, WEB_UI copy, CORS) is indexed in [`docs/README.md`](./docs/README.md).
