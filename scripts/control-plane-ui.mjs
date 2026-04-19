#!/usr/bin/env node

import http from 'http';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const UI_PORT = Number(process.env.UI_PORT || 555);
const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:5555';

const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reshapr Control Plane UI</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #0b1020; color: #e6eaf5; }
    .wrap { max-width: 1100px; margin: 24px auto; padding: 0 16px; }
    h1, h2 { margin: 0 0 12px; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    .card { background: #151d35; border: 1px solid #2b365f; border-radius: 10px; padding: 14px; }
    .row { display: flex; gap: 8px; margin: 8px 0; }
    input, button, textarea { border-radius: 8px; border: 1px solid #3b4a7a; background: #0f1630; color: #e6eaf5; padding: 8px 10px; }
    input, textarea { width: 100%; }
    button { cursor: pointer; background: #315efb; border: none; font-weight: 600; }
    button.secondary { background: #2a355f; }
    pre { margin: 8px 0 0; max-height: 420px; overflow: auto; background: #0d142a; border: 1px solid #2b365f; padding: 10px; border-radius: 8px; }
    .muted { color: #93a0c8; font-size: 13px; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; background: #26335c; margin: 0 6px 6px 0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Reshapr Control Plane UI</h1>
    <p class="muted">Control plane: <code>${CONTROL_PLANE_URL}</code> · UI: <code>http://localhost:${UI_PORT}</code></p>
    <div class="grid">
      <section class="card">
        <h2>Configurations</h2>
        <div class="row">
          <button id="loadConfigs">Charger</button>
        </div>
        <div id="configsMeta" class="muted"></div>
        <pre id="configsOut">Clique sur "Charger"</pre>
      </section>

      <section class="card">
        <h2>Expositions</h2>
        <div class="row">
          <button id="loadExpos">Charger</button>
        </div>
        <div id="exposMeta" class="muted"></div>
        <pre id="exposOut">Clique sur "Charger"</pre>
      </section>
    </div>

    <section class="card" style="margin-top:16px;">
      <h2>MCP Tools (endpoint exposé)</h2>
      <div class="row">
        <input id="mcpUrl" placeholder="http://localhost:7777/mcp/..." />
        <button id="loadMcpUrls" class="secondary">Lister MCP URL</button>
        <button id="loadTools">Lister tools</button>
      </div>
      <div id="mcpUrlsMeta" class="muted"></div>
      <div id="mcpUrlsPills"></div>
      <div id="toolsMeta" class="muted"></div>
      <div id="toolsPills"></div>
      <pre id="toolsOut"></pre>
    </section>
  </div>

  <script>
    const ids = (id) => document.getElementById(id);
    const pretty = (v) => JSON.stringify(v, null, 2);

    async function fetchJson(url, options = {}) {
      const res = await fetch(url, options);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || ("HTTP " + res.status));
      return body;
    }

    ids('loadConfigs').onclick = async () => {
      ids('configsOut').textContent = 'Chargement...';
      try {
        const data = await fetchJson('/api/configurations');
        const list = Array.isArray(data.items) ? data.items : [];
        ids('configsMeta').textContent = list.length + ' configuration(s)';
        ids('configsOut').textContent = pretty(list);
      } catch (e) {
        ids('configsOut').textContent = String(e.message || e);
      }
    };

    ids('loadExpos').onclick = async () => {
      ids('exposOut').textContent = 'Chargement...';
      try {
        const data = await fetchJson('/api/expositions');
        const list = Array.isArray(data.items) ? data.items : [];
        ids('exposMeta').textContent = list.length + ' exposition(s)';
        ids('exposOut').textContent = pretty(list);
      } catch (e) {
        ids('exposOut').textContent = String(e.message || e);
      }
    };

    ids('loadTools').onclick = async () => {
      ids('toolsOut').textContent = 'Chargement...';
      ids('toolsPills').innerHTML = '';
      try {
        const mcpUrl = ids('mcpUrl').value.trim();
        if (!mcpUrl) throw new Error('Renseigne une MCP URL avant de lister les tools.');
        const data = await fetchJson('/api/mcp-tools?url=' + encodeURIComponent(mcpUrl));
        const tools = Array.isArray(data.tools) ? data.tools : [];
        ids('toolsMeta').textContent = tools.length + ' tool(s) sur ' + mcpUrl;
        ids('toolsOut').textContent = pretty(tools);
        ids('toolsPills').innerHTML = tools.map(t => '<span class="pill">' + t.name + '</span>').join('');
      } catch (e) {
        ids('toolsOut').textContent = String(e.message || e);
      }
    };

    ids('loadMcpUrls').onclick = async () => {
      ids('mcpUrlsPills').innerHTML = '';
      ids('mcpUrlsMeta').textContent = 'Chargement...';
      try {
        const data = await fetchJson('/api/mcp-urls');
        const urls = Array.isArray(data.urls) ? data.urls : [];
        ids('mcpUrlsMeta').textContent = urls.length + ' MCP URL(s) détectée(s)';
        ids('mcpUrlsPills').innerHTML = urls
          .map((u) => '<button class="secondary" data-url="' + u.replaceAll('"', '&quot;') + '">' + u + '</button>')
          .join(' ');
        ids('mcpUrlsPills').querySelectorAll('button[data-url]').forEach((btn) => {
          btn.onclick = () => {
            ids('mcpUrl').value = btn.getAttribute('data-url') || '';
          };
        });
      } catch (e) {
        ids('mcpUrlsMeta').textContent = String(e.message || e);
      }
    };
  </script>
</body>
</html>`;

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function runReshaprJson(args) {
  const { stdout } = await execFileAsync('reshapr', [...args, '-o', 'json'], {
    maxBuffer: 4 * 1024 * 1024
  });
  return JSON.parse(stdout);
}

async function runReshaprText(args) {
  const { stdout } = await execFileAsync('reshapr', args, {
    maxBuffer: 4 * 1024 * 1024
  });
  return stdout;
}

async function listByCli(kind) {
  const commands =
    kind === 'config'
      ? [['config', 'list'], ['config', 'ls']]
      : [['expo', 'list'], ['expo', 'ls']];

  for (const args of commands) {
    try {
      const parsed = await runReshaprJson(args);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.result)) return parsed.result;
      if (Array.isArray(parsed?.items)) return parsed.items;
      if (Array.isArray(parsed?.data)) return parsed.data;
      return [parsed];
    } catch {
      // Try next command variant.
    }
  }
  throw new Error(`Impossible de lister ${kind} via reShapr CLI (teste: ${commands.map((c) => c.join(' ')).join(', ')})`);
}

function extractEndpointValue(detailsText) {
  const lines = String(detailsText || '').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*Endpoints?\s*:\s*(.+)$/i);
    if (!match) continue;
    const raw = match[1].trim().replace(/^["'{[]+|[}\]'"]+$/g, '');
    if (raw && !raw.includes('{endpoint MCP}')) return raw;
  }
  return '';
}

function toAbsoluteMcpUrl(endpointValue, expo) {
  const cleaned = String(endpointValue || '').trim().replace(/[),.;]+$/g, '');
  if (!cleaned) return '';

  const gatewayFqdn = expo?.gateways?.[0]?.fqdns?.[0];
  const gatewayHost =
    typeof gatewayFqdn === 'string' && gatewayFqdn.trim()
      ? gatewayFqdn.startsWith('http://') || gatewayFqdn.startsWith('https://')
        ? gatewayFqdn
        : `http://${gatewayFqdn}`
      : '';

  const candidates = [];

  if (/^https?:\/\//i.test(cleaned)) candidates.push(cleaned);
  if (/^[^/\s]+:\d+\/mcp(\/|$)/i.test(cleaned)) candidates.push(`http://${cleaned}`);
  if (cleaned.startsWith('/')) {
    if (gatewayHost) candidates.push(new URL(cleaned, gatewayHost).href);
    candidates.push(new URL(cleaned, CONTROL_PLANE_URL).href);
  }

  if (cleaned.toLowerCase().startsWith('mcp/')) {
    if (gatewayHost) candidates.push(`${gatewayHost.replace(/\/+$/g, '')}/${cleaned.replace(/^\/+/, '')}`);
    candidates.push(`${CONTROL_PLANE_URL.replace(/\/+$/g, '')}/${cleaned.replace(/^\/+/, '')}`);
  }

  if (candidates.length === 0 && gatewayHost) {
    candidates.push(`${gatewayHost.replace(/\/+$/g, '')}/${cleaned.replace(/^\/+/, '')}`);
  }

  for (const candidate of candidates) {
    try {
      if (/\/mcp(\/|$)/i.test(new URL(candidate).pathname)) return candidate;
    } catch {
      // Ignore malformed candidate.
    }
  }
  return '';
}

async function listMcpUrls() {
  const expos = await listByCli('expo');
  const urls = new Set();

  // Primary strategy requested by user:
  // expo list -o json -> expo get {expo_id} -> parse "Endpoints: ..."
  for (const expo of expos) {
    if (!expo || typeof expo !== 'object') continue;
    const expoId = typeof expo.id === 'string' ? expo.id.trim() : '';
    if (!expoId) continue;

    let details = '';
    try {
      details = await runReshaprText(['expo', 'get', expoId]);
    } catch {
      // If one exposition fails, continue with others.
      continue;
    }

    const endpointValue = extractEndpointValue(details);
    const absoluteUrl = toAbsoluteMcpUrl(endpointValue, expo);
    if (absoluteUrl) urls.add(absoluteUrl);
  }

  return [...urls];
}

async function mcpJsonRpc(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Reponse non-JSON (HTTP ${response.status}): ${text.slice(0, 180)}`);
  }
  if (!response.ok || data.error) {
    throw new Error(`MCP error (HTTP ${response.status}): ${JSON.stringify(data.error || data)}`);
  }
  return data;
}

async function listMcpTools(url) {
  await mcpJsonRpc(url, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'control-plane-ui', version: '1.0.0' }
    }
  });

  const listed = await mcpJsonRpc(url, {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });

  return listed?.result?.tools || [];
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  try {
    if (req.method === 'GET' && url.pathname === '/api/configurations') {
      const items = await listByCli('config');
      sendJson(res, 200, { items });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/expositions') {
      const items = await listByCli('expo');
      sendJson(res, 200, { items });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/mcp-tools') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        sendJson(res, 400, { error: 'Missing query parameter: url' });
        return;
      }
      const tools = await listMcpTools(targetUrl);
      sendJson(res, 200, { tools });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/mcp-urls') {
      const urls = await listMcpUrls();
      sendJson(res, 200, { urls });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 500, { error: error.message || String(error) });
  }
});

server.listen(UI_PORT, () => {
  console.log(`Control Plane UI running on http://localhost:${UI_PORT}`);
  console.log(`Control plane target: ${CONTROL_PLANE_URL}`);
});
