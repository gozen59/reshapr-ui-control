# reshapr-ui-control

Lightweight web UI to quickly inspect a local Reshapr control plane and tools exposed by an MCP endpoint.

## Goal

This project provides a minimal local dashboard to:

- list configuration plans from PostgreSQL (`configuration_plans`, joined with `services`);
- list expositions from PostgreSQL (same shape as the CLI `expo list`: service, configuration plan, gateways);
- list MCP tools from PostgreSQL (artifact `RESHAPR_CUSTOM_TOOLS` or `services_operations` filtered by `included_operations`);
- optionally run a **second UI** on another port that mirrors the same views using **only the `reshapr` CLI** (for side-by-side comparison).

Two Node.js scripts are provided:

- `scripts/control-plane-ui.mjs` — **PostgreSQL** (Docker `reshapr-postgres`), default **http://localhost:555**;
- `scripts/control-plane-cli-ui.mjs` — **`reshapr` CLI only**, default **http://localhost:1556** (second écran / comparaison).

## Prerequisites

- Node.js 18+ (or a recent version with global `fetch`);
- a local Reshapr control plane URL for display only (default: `http://localhost:5555`);
- Docker with the `reshapr-postgres` container for **`control-plane-ui.mjs`** (PostgreSQL);
- the **`reshapr`** CLI on your `PATH` for **`control-plane-cli-ui.mjs`** (CLI + HTTP MCP for tools only).

## Run the UIs

**Base de données** (port 555 par défaut) :

```bash
node scripts/control-plane-ui.mjs
```

Open **http://localhost:555**.

**CLI** (port 1556 par défaut, autre onglet / écran) :

```bash
node scripts/control-plane-cli-ui.mjs
```

Open **http://localhost:1556**.

On startup, each script logs its URL and the control plane display target.

## Environment Variables

The following values are optional:

**PostgreSQL UI** (`control-plane-ui.mjs`):

- `UI_PORT`: web UI port (default: `555`);
- `CONTROL_PLANE_URL`: control plane URL displayed in the UI (default: `http://localhost:5555`).

**CLI UI** (`control-plane-cli-ui.mjs`):

- `CLI_UI_PORT`: web UI port (default: `1556`);
- `CONTROL_PLANE_URL`: same as above;
- `DB_UI_PORT`: port shown in the CLI UI banner as the link to the DB UI (default: `555`, should match `UI_PORT` of the other process).

Examples:

```bash
UI_PORT=8080 \
CONTROL_PLANE_URL=http://localhost:9000 \
node scripts/control-plane-ui.mjs
```

```bash
CLI_UI_PORT=5560 \
DB_UI_PORT=8080 \
node scripts/control-plane-cli-ui.mjs
```

## How It Works

### 1) Configurations and expositions (PostgreSQL)

The **Charger (DB)** buttons call:

- `GET /api/configurations` — rows from `configuration_plans` with optional nested `service` (`services`);
- `GET /api/expositions` — rows built from `expositions` + `services` + `configuration_plans` + aggregated `gateways` (via `gateway_groups` / `gateways_gateway_groups`).

Both responses include `"source": "postgresql"`.

### 2) MCP URLs and tools from PostgreSQL

Use **"List MCP URL (DB)"** to retrieve MCP URLs from PostgreSQL joins (`expositions`, `services`, `gateway_groups`, `gateways_gateway_groups`, `gateways`). Click a URL to fill the MCP URL field.

Use **"List tools (DB)"** to resolve the exposition for that MCP URL (organization, service name, version, gateway FQDN), then load tools from the database:

- if an artifact `RESHAPR_CUSTOM_TOOLS` exists for the service, tools are parsed from its YAML `customTools` (filtered by `configuration_plans.included_operations` when that list is non-empty);
- otherwise, tools are built from `services_operations` rows whose `name` is listed in `included_operations`.

The API response includes `source` (`artifacts_custom_tools` or `services_operations`) and `expo_id` for traceability.

### 3) CLI-only UI (`control-plane-cli-ui.mjs`)

- **Configurations / expositions** : `reshapr config list` / `reshapr expo list` (with fallbacks `ls` where supported).
- **MCP URLs** : `expo list` puis pour chaque id `expo get`, parsing de la ligne `Endpoints:` (pas PostgreSQL).
- **Tools** : HTTP JSON-RPC `initialize` + `tools/list` sur l’URL MCP (non disponible via la CLI `reshapr`).

Local API for the CLI UI:

- `GET /api/configurations` — `{ items: [...], source: "cli" }`;
- `GET /api/expositions` — `{ items: [...], source: "cli" }`;
- `GET /api/mcp-urls` — `{ urls: [...], source: "cli" }`;
- `GET /api/mcp-tools?url=...` — `{ tools: [...], source: "http_mcp" }`.

## Exposed Local API (PostgreSQL UI, port `UI_PORT`)

- `GET /`: HTML UI page;
- `GET /api/configurations`: `{ items: [...], source: "postgresql" }`;
- `GET /api/expositions`: `{ items: [...], source: "postgresql" }`;
- `GET /api/mcp-urls-db`: `{ urls: [...], items: [...] }`;
- `GET /api/mcp-tools-db?url=...`: `{ tools: [...], source: string, expo_id: string }`.

On errors, routes return a structured JSON payload:

```json
{ "error": "explicit message" }
```

## Troubleshooting

- **Database / Docker errors**
  - ensure the `reshapr-postgres` container is running and reachable from the machine running this UI;
  - all reads use `docker exec reshapr-postgres psql -U reshapr -d reshapr ...`.
- **Port already in use**
  - change `UI_PORT` or `CLI_UI_PORT` so the two servers do not bind the same port.
- **CLI UI errors**
  - ensure `reshapr` is installed and works (`reshapr config list -o json`, `reshapr expo list -o json`).

## Known Limitations

- intentionally simple UI, with no authentication or persistence;
- `CONTROL_PLANE_URL` is informational (shown in the header); data is loaded from PostgreSQL via Docker, not from the control plane HTTP API.
