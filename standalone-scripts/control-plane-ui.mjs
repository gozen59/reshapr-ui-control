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
          <button id="loadConfigs">Charger (DB)</button>
        </div>
        <div id="configsMeta" class="muted"></div>
        <pre id="configsOut">Clique sur "Charger"</pre>
      </section>

      <section class="card">
        <h2>Expositions</h2>
        <div class="row">
          <button id="loadExpos">Charger (DB)</button>
        </div>
        <div id="exposMeta" class="muted"></div>
        <pre id="exposOut">Clique sur "Charger"</pre>
      </section>
    </div>

    <section class="card" style="margin-top:16px;">
      <h2>MCP Tools (endpoint exposé)</h2>
      <div class="row">
        <input id="mcpUrl" placeholder="http://localhost:7777/mcp/..." />
        <button id="loadMcpUrlsDb" class="secondary">Lister MCP URL (DB)</button>
        <button id="loadTools">Lister tools (DB)</button>
      </div>
      <div id="mcpUrlsDbMeta" class="muted"></div>
      <div id="mcpUrlsDbPills"></div>
      <div id="toolsMeta" class="muted"></div>
      <div id="toolsPills"></div>
      <pre id="toolsOut"></pre>
      <pre id="mcpUrlsDbOut"></pre>
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
        ids('configsMeta').textContent = list.length + ' configuration(s) (PostgreSQL)';
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
        ids('exposMeta').textContent = list.length + ' exposition(s) (PostgreSQL)';
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
        const data = await fetchJson('/api/mcp-tools-db?url=' + encodeURIComponent(mcpUrl));
        const tools = Array.isArray(data.tools) ? data.tools : [];
        const src = data.source ? String(data.source) : '';
        const ex = data.expo_id ? String(data.expo_id) : '';
        ids('toolsMeta').textContent =
          tools.length + ' tool(s) (DB' + (src ? ', ' + src : '') + (ex ? ', expo ' + ex : '') + ') pour ' + mcpUrl;
        ids('toolsOut').textContent = pretty({ tools, source: data.source, expo_id: data.expo_id });
        ids('toolsPills').innerHTML = tools.map(t => '<span class="pill">' + t.name + '</span>').join('');
      } catch (e) {
        ids('toolsOut').textContent = String(e.message || e);
      }
    };

    ids('loadMcpUrlsDb').onclick = async () => {
      ids('mcpUrlsDbPills').innerHTML = '';
      ids('mcpUrlsDbOut').textContent = '';
      ids('mcpUrlsDbMeta').textContent = 'Chargement...';
      try {
        const data = await fetchJson('/api/mcp-urls-db');
        const urls = Array.isArray(data.urls) ? data.urls : [];
        const items = Array.isArray(data.items) ? data.items : [];
        ids('mcpUrlsDbMeta').textContent = urls.length + ' MCP URL(s) détectée(s) depuis la DB';
        ids('mcpUrlsDbPills').innerHTML = urls
          .map((u) => '<button class="secondary" data-url="' + u.replaceAll('"', '&quot;') + '">' + u + '</button>')
          .join(' ');
        ids('mcpUrlsDbPills').querySelectorAll('button[data-url]').forEach((btn) => {
          btn.onclick = () => {
            ids('mcpUrl').value = btn.getAttribute('data-url') || '';
          };
        });
        ids('mcpUrlsDbOut').textContent = pretty(items);
      } catch (e) {
        ids('mcpUrlsDbMeta').textContent = String(e.message || e);
      }
    };
  </script>
</body>
</html>`;

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function runPsqlJson(sql) {
  const command = `docker exec reshapr-postgres psql -U reshapr -d reshapr -t -A -c "${sql.replaceAll('"', '\\"')}"`;
  const { stdout } = await execFileAsync('sh', ['-lc', command], {
    maxBuffer: 4 * 1024 * 1024
  });
  const raw = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('');
  if (!raw) return [];
  return JSON.parse(raw);
}

async function listConfigurationsFromDb() {
  const rows = await runPsqlJson(`
SELECT COALESCE(json_agg(t.row ORDER BY t.plan_name), '[]'::json)::text
FROM (
  SELECT json_build_object(
    'id', cp.id,
    'name', cp.name,
    'description', cp.description,
    'organizationId', cp.organization_id,
    'backendEndpoint', cp.backend_endpoint,
    'serviceId', cp.service_id,
    'includedOperations', cp.included_operations,
    'excludedOperations', cp.excluded_operations,
    'service', CASE WHEN s.id IS NOT NULL THEN json_build_object(
      'id', s.id,
      'name', s.name,
      'version', s.version,
      'type', s.type
    ) ELSE NULL END
  ) AS row,
  cp.name AS plan_name
  FROM configuration_plans cp
  LEFT JOIN services s ON s.id = cp.service_id
) t;
  `);
  return Array.isArray(rows) ? rows : [];
}

async function listExpositionsFromDb() {
  const rows = await runPsqlJson(`
SELECT COALESCE(json_agg(t.row ORDER BY t.sort_key DESC NULLS LAST), '[]'::json)::text
FROM (
  SELECT json_build_object(
    'id', e.id,
    'organizationId', e.organization_id,
    'createdOn', e.created_on,
    'service', json_build_object(
      'id', s.id,
      'name', s.name,
      'version', s.version,
      'type', s.type
    ),
    'configurationPlan', json_build_object(
      'id', cp.id,
      'name', cp.name,
      'backendEndpoint', cp.backend_endpoint
    ),
    'gateways', COALESCE((
      SELECT json_agg(json_build_object(
        'id', g.id,
        'name', g.name,
        'fqdns', COALESCE(g.fqdns::json, '[]'::json)
      ))
      FROM gateways_gateway_groups ggg
      JOIN gateways g ON g.id = ggg.gateway_id
      WHERE ggg.gateway_group_id = e.gateway_group_id
    ), '[]'::json)
  ) AS row,
  e.created_on AS sort_key
  FROM expositions e
  JOIN services s ON s.id = e.service_id
  JOIN configuration_plans cp ON cp.id = e.configuration_plan_id
) t;
  `);
  return Array.isArray(rows) ? rows : [];
}

function sqlString(value) {
  return String(value ?? '').replace(/'/g, "''");
}

function parseMcpUrlForDb(mcpUrl) {
  let u;
  try {
    u = new URL(mcpUrl);
  } catch {
    throw new Error('URL MCP invalide');
  }
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 4 || String(parts[0]).toLowerCase() !== 'mcp') {
    throw new Error('Chemin MCP attendu: /mcp/{organization}/{service}/{version}');
  }
  const orgId = decodeURIComponent(parts[1].replace(/\+/g, '%20'));
  const serviceName = decodeURIComponent(parts[2].replace(/\+/g, '%20'));
  const version = decodeURIComponent(parts.slice(3).join('/').replace(/\+/g, '%20'));
  return { orgId, serviceName, version, host: u.host };
}

function parseInputSchemaFromYamlBlock(block) {
  const m = block.match(/^    input:\s*\n([\s\S]+)/m);
  if (!m) return { type: 'object', properties: {} };
  const body = m[1];
  const properties = {};
  let cur = null;
  for (const line of body.split('\n')) {
    const prop = line.match(/^        ([a-zA-Z0-9_]+):\s*$/);
    if (prop) {
      cur = prop[1];
      properties[cur] = {};
      continue;
    }
    if (!cur) continue;
    const typ = line.match(/^          type:\s*(.+)$/);
    if (typ) properties[cur].type = typ[1].trim();
    const desc = line.match(/^          description:\s*(.+)$/);
    if (desc) properties[cur].description = desc[1].trim();
    const def = line.match(/^          default:\s*(.+)$/);
    if (def) {
      const v = def[1].trim();
      properties[cur].default = /^\d+$/.test(v) ? Number(v) : v;
    }
  }
  return { type: 'object', properties };
}

function parseReshaprCustomToolsYaml(content) {
  if (!content || typeof content !== 'string') return [];
  const marker = 'customTools:';
  const idx = content.indexOf(marker);
  if (idx === -1) return [];
  let rest = content.slice(idx + marker.length);
  rest = rest.replace(/^\s*\n/, '');
  const tools = [];
  const keyRe = /^  ([a-zA-Z0-9_]+):\s*$/gm;
  const keys = [];
  let mm;
  while ((mm = keyRe.exec(rest)) !== null) {
    keys.push({ name: mm[1], start: mm.index, endHeader: mm.index + mm[0].length });
  }
  for (let i = 0; i < keys.length; i++) {
    const block = rest.slice(keys[i].endHeader, i + 1 < keys.length ? keys[i + 1].start : rest.length);
    const toolLine = block.match(/^\s{4}tool:\s*(.+)$/m);
    const titleLine = block.match(/^\s{4}title:\s*(.+)$/m);
    let description = '';
    const folded = block.match(/^\s{4}description:\s*>\s*\n([\s\S]*?)(?=^\s{4}(?:input|tool|title):)/m);
    if (folded) {
      description = folded[1]
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' ')
        .trim();
    } else {
      const inlineD = block.match(/^\s{4}description:\s*(.+)$/m);
      if (inlineD) description = inlineD[1].trim();
    }
    const inputSchema = parseInputSchemaFromYamlBlock(block);
    tools.push({
      name: keys[i].name,
      tool: toolLine ? toolLine[1].trim() : '',
      description: description || (titleLine ? titleLine[1].trim() : ''),
      inputSchema
    });
  }
  return tools;
}

function includedOperationsList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function filterCustomToolsByIncluded(tools, included) {
  if (!included.length) return tools;
  const set = new Set(included);
  return tools.filter((t) => t.tool && set.has(t.tool));
}

function toolNameFromOperation(operationName) {
  let s = String(operationName || '').trim();
  if (!s) return 'unnamed_tool';
  s = s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/_+/g, '_');
  if (/^[0-9]/.test(s)) s = `op_${s}`;
  return s;
}

async function fetchExpoDbContext(orgId, serviceName, version, host, strictGateway) {
  const gatewayFilter = strictGateway
    ? `AND g.fqdns @> to_jsonb(array['${sqlString(host)}']::text[])`
    : '';
  const sql = `
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text
FROM (
  SELECT
    e.id AS expo_id,
    e.service_id,
    cp.included_operations,
    (SELECT a.content FROM artifacts a
     WHERE a.service_id = e.service_id AND a.type = 'RESHAPR_CUSTOM_TOOLS'
     ORDER BY a.name NULLS LAST LIMIT 1) AS custom_tools_yaml
  FROM expositions e
  JOIN services s ON s.id = e.service_id
    AND s.organization_id = '${sqlString(orgId)}'
    AND s.name = '${sqlString(serviceName)}'
    AND s.version = '${sqlString(version)}'
  JOIN configuration_plans cp ON cp.id = e.configuration_plan_id
  JOIN gateway_groups gg ON gg.id = e.gateway_group_id
  JOIN gateways_gateway_groups ggg ON ggg.gateway_group_id = gg.id
  JOIN gateways g ON g.id = ggg.gateway_id
  WHERE 1 = 1
  ${gatewayFilter}
  ORDER BY e.created_on DESC
  LIMIT 1
) t;
`;
  const rows = await runPsqlJson(sql);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function fetchOperationsForService(serviceId, included) {
  if (!serviceId || !included.length) return [];
  const includedEncoded = sqlString(JSON.stringify(included));
  const sql = `
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text
FROM (
  SELECT so.name AS operation_name, so.method, so.action, so.input_name, so.output_name
  FROM services_operations so
  WHERE so.service_id = '${sqlString(serviceId)}'
    AND so.name IN (SELECT jsonb_array_elements_text('${includedEncoded}'::jsonb))
  ORDER BY so.name
) t;
`;
  return runPsqlJson(sql);
}

async function listMcpToolsFromDb(mcpUrl) {
  const { orgId, serviceName, version, host } = parseMcpUrlForDb(mcpUrl);
  let ctx = await fetchExpoDbContext(orgId, serviceName, version, host, true);
  if (!ctx) ctx = await fetchExpoDbContext(orgId, serviceName, version, host, false);
  if (!ctx) throw new Error('Aucune exposition trouvée en base pour cette MCP URL');
  const included = includedOperationsList(ctx.included_operations);
  const customParsed = parseReshaprCustomToolsYaml(ctx.custom_tools_yaml || '');
  const customFiltered = filterCustomToolsByIncluded(customParsed, included);
  const customOut = customFiltered.map((t) => ({
    name: t.name,
    description: t.description || '',
    inputSchema: t.inputSchema || { type: 'object', properties: {} }
  }));
  if (customOut.length > 0) {
    return { tools: customOut, source: 'artifacts_custom_tools', expo_id: ctx.expo_id };
  }
  const ops = await fetchOperationsForService(ctx.service_id, included);
  const restOut = ops.map((op) => ({
    name: toolNameFromOperation(op.operation_name),
    description: op.operation_name,
    inputSchema: { type: 'object' }
  }));
  return { tools: restOut, source: 'services_operations', expo_id: ctx.expo_id };
}

async function listMcpUrlsFromDb() {
  const rows = await runPsqlJson(`
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text
FROM (
  SELECT
    e.id AS expo_id,
    e.organization_id,
    s.name AS service_name,
    s.version AS service_version,
    g.name AS gateway_name,
    fqdn.value AS gateway_fqdn,
    ('http://' || fqdn.value || '/mcp/' || e.organization_id || '/' || replace(s.name, ' ', '+') || '/' || s.version) AS mcp_url
  FROM expositions e
  JOIN services s ON s.id = e.service_id
  JOIN gateway_groups gg ON gg.id = e.gateway_group_id
  LEFT JOIN gateways_gateway_groups ggg ON ggg.gateway_group_id = gg.id
  LEFT JOIN gateways g ON g.id = ggg.gateway_id
  LEFT JOIN LATERAL jsonb_array_elements_text(COALESCE(g.fqdns, '[]'::jsonb)) AS fqdn(value) ON TRUE
  ORDER BY e.created_on DESC, e.id
) t;
  `);

  const items = Array.isArray(rows) ? rows.filter((r) => r && r.mcp_url) : [];
  const urls = [...new Set(items.map((row) => row.mcp_url))];
  return { urls, items };
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
      const items = await listConfigurationsFromDb();
      sendJson(res, 200, { items, source: 'postgresql' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/expositions') {
      const items = await listExpositionsFromDb();
      sendJson(res, 200, { items, source: 'postgresql' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/mcp-tools-db') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        sendJson(res, 400, { error: 'Missing query parameter: url' });
        return;
      }
      const payload = await listMcpToolsFromDb(targetUrl);
      sendJson(res, 200, payload);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/mcp-urls-db') {
      const data = await listMcpUrlsFromDb();
      sendJson(res, 200, data);
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
