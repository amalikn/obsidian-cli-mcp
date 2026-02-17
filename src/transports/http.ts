import { randomUUID } from 'node:crypto'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export async function startHttpTransport(server: McpServer, port: number): Promise<void> {
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
    const sessionId = request.headers['mcp-session-id'] as string
    const transport = sessionId ? transports.get(sessionId) : undefined

    if (!transport) {
      reply.status(400).send({ error: 'Missing or invalid mcp-session-id' })
      return
    }

    await transport.handleRequest(request.raw, reply.raw)
  })

  app.delete('/mcp', async (request, reply) => {
    const sessionId = request.headers['mcp-session-id'] as string
    const transport = sessionId ? transports.get(sessionId) : undefined

    if (!transport) {
      reply.status(400).send({ error: 'Missing or invalid mcp-session-id' })
      return
    }

    await transport.handleRequest(request.raw, reply.raw)
    transports.delete(sessionId)
  })

  await app.listen({ port, host: '0.0.0.0' })
  console.error(`MCP HTTP server listening on port ${port}`)
}
