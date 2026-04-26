# reshapr-ui-control

**Purpose:** this project exists to provide a **web UI** for [Reshapr](https://github.com/reshaprio/reshapr) — a browser-based console for the control plane that complements the **Reshapr CLI** from the same GitHub repository, without replacing it (same REST surface, different workflows).

Web console (SPA) for the **Reshapr control plane**: same REST endpoints as the CLI (`/api/config`, `/auth/login/reshapr`, `/api/v1/...`). La page **MCP custom tools** (`/mcp-custom-tools`) résout les outils déclarés dans l’artifact `RESHAPR_CUSTOM_TOOLS` à partir d’une URL MCP, comme le ferait une inspection alignée sur le control-plane.

## Prerequisites

- Reshapr control plane reachable (e.g. `http://localhost:5555`).
- CORS: on the Quarkus server, set `RESHAPR_HTTP_CORS_ORIGINS` to include this app’s origin (e.g. `http://localhost:5173`). See the **reshapr** repo (`docs/WEB_UI.md`, `application.properties`).

## Getting started

```bash
npm install
cp .env.example .env   # optional
npm run dev
```

Open the URL printed by Vite (often `http://localhost:5173`), enter the control plane URL, then **on-premises** credentials (`POST /auth/login/reshapr`).

**SaaS** mode does not implement the browser OAuth flow; use the `reshapr login` CLI or extend this app.

## Documentation

- **Index**: [`docs/README.md`](./docs/README.md) — chat export, Cursor plan, user rules, `WEB_UI` copy, CORS, etc.
- [`PLAN.md`](./PLAN.md) — API plan / UI feasibility summary.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — **reshapr** integration and environment variables.
- Cursor agent rules: [`.cursor/rules/reshapr-ui-control.mdc`](./.cursor/rules/reshapr-ui-control.mdc).

## Production build

```bash
npm run build
npm run preview
```

Static assets are in `dist/`.