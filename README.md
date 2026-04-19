# reshapr-ui-control

Lightweight web UI to quickly inspect a local Reshapr control plane and tools exposed by an MCP endpoint.

## Goal

This project provides a minimal local dashboard to:

- list configuration plans from PostgreSQL (`configuration_plans`, joined with `services`);
- list expositions from PostgreSQL (same shape as the CLI `expo list`: service, configuration plan, gateways);
- list MCP tools from PostgreSQL (artifact `RESHAPR_CUSTOM_TOOLS` or `services_operations` filtered by `included_operations`).

Everything is handled by a single Node.js script: `scripts/control-plane-ui.mjs`.

## Prerequisites

- Node.js 18+ (or a recent version with global `fetch`);
- a local Reshapr control plane URL for display only (default: `http://localhost:5555`);
- Docker with the `reshapr-postgres` container (all lists and MCP metadata are read from PostgreSQL).

## Run the UI

From the project root:

```bash
node scripts/control-plane-ui.mjs
```

Then open:

```text
http://localhost:555
```

On startup, the script logs:

- the UI URL;
- the control plane target.

## Environment Variables

The following values are optional:

- `UI_PORT`: web UI port (default: `555`);
- `CONTROL_PLANE_URL`: control plane URL displayed in the UI (default: `http://localhost:5555`).

Example:

```bash
UI_PORT=8080 \
CONTROL_PLANE_URL=http://localhost:9000 \
node scripts/control-plane-ui.mjs
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

## Exposed Local API

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
  - change `UI_PORT` before running the script.

## Known Limitations

- intentionally simple UI, with no authentication or persistence;
- `CONTROL_PLANE_URL` is informational (shown in the header); data is loaded from PostgreSQL via Docker, not from the control plane HTTP API.
