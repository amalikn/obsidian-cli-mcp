import { randomUUID, timingSafeEqual } from 'node:crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export interface HttpTransportOptions {
  host: string
  port: number
  authToken?: string
}

export async function buildHttpApp(
  server: McpServer,
  options: HttpTransportOptions,
): Promise<FastifyInstance> {
  const { default: Fastify } = await import('fastify')
  const app = Fastify()
  const transports = new Map<string, StreamableHTTPServerTransport>()

  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_, body, done) => {
    try {
      done(null, JSON.parse(body as string))
    } catch (err) {
      done(err as Error)
    }
  })

  app.addHook('onRequest', async (request, reply) => {
    if (!options.authToken) return
    if (isAuthorizedRequest(request, options.authToken)) return

    reply.header('www-authenticate', 'Bearer realm="obsidian-cli-mcp"')
    reply.status(401).send({ error: 'Unauthorized' })
  })

  app.post('/mcp', async (request, reply) => {
    const sessionId = (request.headers['mcp-session-id'] as string) ?? randomUUID()

    let transport = transports.get(sessionId)
    if (!transport) {
      transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => sessionId })
      transports.set(sessionId, transport)
      await server.connect(transport)
    }

    await transport.handleRequest(request.raw, reply.raw, request.body)
  })

  app.get('/mcp', async (request, reply) => {
    const transport = getExistingTransport(request, reply, transports)
    if (!transport) return

    await transport.handleRequest(request.raw, reply.raw)
  })

  app.delete('/mcp', async (request, reply) => {
    const sessionId = request.headers['mcp-session-id'] as string
    const transport = getExistingTransport(request, reply, transports)
    if (!transport) return

    await transport.handleRequest(request.raw, reply.raw)
    transports.delete(sessionId)
  })

  return app
}

export async function startHttpTransport(
  server: McpServer,
  options: HttpTransportOptions,
): Promise<void> {
  const app = await buildHttpApp(server, options)

  await app.listen({ port: options.port, host: options.host })
  console.error(`MCP HTTP server listening on http://${options.host}:${options.port}/mcp`)
}

function getExistingTransport(
  request: FastifyRequest,
  reply: FastifyReply,
  transports: Map<string, StreamableHTTPServerTransport>,
): StreamableHTTPServerTransport | undefined {
  const sessionId = request.headers['mcp-session-id'] as string
  const transport = sessionId ? transports.get(sessionId) : undefined

  if (!transport) {
    reply.status(400).send({ error: 'Missing or invalid mcp-session-id' })
    return undefined
  }

  return transport
}

function isAuthorizedRequest(request: FastifyRequest, authToken: string): boolean {
  const authorizationHeader = request.headers['authorization']
  const bearerToken = typeof authorizationHeader === 'string' ? extractBearerToken(authorizationHeader) : undefined
  if (!bearerToken) return false

  return constantTimeEquals(bearerToken, authToken)
}

function extractBearerToken(authorizationHeader: string): string | undefined {
  const [scheme, token] = authorizationHeader.split(' ')
  if (!scheme || !token) return undefined
  if (scheme.toLowerCase() !== 'bearer') return undefined

  const normalizedToken = token.trim()
  return normalizedToken ? normalizedToken : undefined
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}
