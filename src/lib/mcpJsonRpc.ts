/**
 * Appels JSON-RPC MCP depuis le navigateur (POST direct sur l’URL MCP).
 * Séquence MCP standard : {@code initialize} puis méthode métier ({@code prompts/list}, etc.).
 * Attention CORS : le serveur MCP doit autoriser l’origine de cette SPA.
 */

const MCP_PROTOCOL_VERSION = '2024-11-05'

export class McpRpcError extends Error {
  readonly httpStatus: number
  readonly rpcError?: unknown

  constructor(message: string, httpStatus: number, rpcError?: unknown) {
    super(message)
    this.name = 'McpRpcError'
    this.httpStatus = httpStatus
    this.rpcError = rpcError
  }
}

export async function mcpJsonRpc(url: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let data: unknown
  try {
    data = JSON.parse(text) as unknown
  } catch {
    throw new McpRpcError(`Non-JSON response (HTTP ${response.status}): ${text.slice(0, 180)}`, response.status)
  }
  const obj = data as { error?: unknown }
  if (!response.ok || obj.error) {
    throw new McpRpcError(
      `MCP error (HTTP ${response.status}): ${JSON.stringify(obj.error ?? data)}`,
      response.status,
      obj.error,
    )
  }
  return data
}

export type McpPromptArgument = {
  name: string
  description?: string
  required?: boolean
}

export type McpPromptDescriptor = {
  name: string
  description?: string
  arguments?: McpPromptArgument[]
}

export type McpPromptsListPayload = {
  prompts: McpPromptDescriptor[]
}

export async function listMcpPromptsFromUrl(mcpUrl: string): Promise<McpPromptsListPayload> {
  await mcpJsonRpc(mcpUrl, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'reshapr-ui-control', version: '1.0.0' },
    },
  })

  const listed = (await mcpJsonRpc(mcpUrl, {
    jsonrpc: '2.0',
    id: 2,
    method: 'prompts/list',
    params: {},
  })) as { result?: { prompts?: McpPromptDescriptor[] } }

  const prompts = Array.isArray(listed?.result?.prompts) ? listed.result.prompts : []
  return { prompts }
}
