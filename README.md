# reshapr-ui-control

Lightweight web UI to quickly inspect a local Reshapr control plane and tools exposed by an MCP endpoint.

## Goal

This project provides a minimal local dashboard to:

- list available Reshapr configurations;
- list Reshapr expositions;
- query an MCP endpoint to retrieve available tools (`initialize` then `tools/list`).

Everything is handled by a single Node.js script: `scripts/control-plane-ui.mjs`.

## Prerequisites

- Node.js 18+ (or a recent version with global `fetch`);
- `reshapr` binary available in your `PATH`;
- a local Reshapr control plane (default: `http://localhost:5555`);
- an accessible MCP endpoint.

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

### 1) Configurations and expositions

The "Load" buttons call local HTTP endpoints:

- `GET /api/configurations`
- `GET /api/expositions`

These routes execute the `reshapr` CLI with JSON output:

- configurations: tries `reshapr config list -o json`, then falls back to `reshapr config ls -o json`;
- expositions: tries `reshapr expo list -o json`, then falls back to `reshapr expo ls -o json`.

The script normalizes several output formats (`result`, `items`, `data`, raw array).

### 2) MCP Tools

Use **"List MCP URL"** to discover MCP endpoints extracted from the exposition payload, then click one to fill the MCP URL input.

The "List tools" button calls:

- `GET /api/mcp-tools?url=<endpoint>`

The server then performs two JSON-RPC requests against the target endpoint:

1. `initialize`
2. `tools/list`

The response is shown both as raw JSON and as pills (tool names).

## Exposed Local API

- `GET /`: HTML UI page;
- `GET /api/configurations`: `{ items: [...] }`;
- `GET /api/expositions`: `{ items: [...] }`;
- `GET /api/mcp-urls`: `{ urls: [...] }`;
- `GET /api/mcp-tools?url=...`: `{ tools: [...] }`.

On errors, routes return a structured JSON payload:

```json
{ "error": "explicit message" }
```

## Troubleshooting

- **`Impossible de lister ... via reShapr CLI`**
  - make sure the `reshapr` command is installed and available in your `PATH`.
- **MCP error (`MCP error` or `Reponse non-JSON`)**
  - check the MCP URL;
  - verify the endpoint accepts JSON-RPC POST requests.
- **Port already in use**
  - change `UI_PORT` before running the script.

## Known Limitations

- intentionally simple UI, with no authentication or persistence;
- `CONTROL_PLANE_URL` is currently informational (shown in the header), while list retrieval relies on the `reshapr` CLI.
