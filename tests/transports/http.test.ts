import { afterEach, describe, expect, it, vi } from 'vitest'

const connectMock = vi.fn()

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => {
  class FakeStreamableHTTPServerTransport {
    private readonly sessionId: string

    constructor(options: { sessionIdGenerator: () => string }) {
      this.sessionId = options.sessionIdGenerator()
    }

    async handleRequest(
      _request: unknown,
      reply: {
        statusCode?: number
        setHeader: (name: string, value: string) => unknown
        end: (body?: string) => unknown
      },
      body?: unknown,
    ) {
      reply.statusCode = 200
      reply.setHeader('content-type', 'application/json')
      reply.end(JSON.stringify({ ok: true, body, sessionId: this.sessionId }))
    }
  }

  return { StreamableHTTPServerTransport: FakeStreamableHTTPServerTransport }
})

const { buildHttpApp } = await import('../../src/transports/http.js')

afterEach(() => {
  vi.clearAllMocks()
})

describe('HTTP transport hardening', () => {
  it('allows unauthenticated loopback HTTP only when no auth token is configured', async () => {
    const app = await buildHttpApp(createServerStub(), { host: '127.0.0.1', port: 3000 })

    const response = await app.inject({
      method: 'POST',
      url: '/mcp',
      payload: { jsonrpc: '2.0', id: 1, method: 'initialize' },
    })

    expect(response.statusCode).toBe(200)
    expect(connectMock).toHaveBeenCalledTimes(1)
    await app.close()
  })

  it('rejects unauthenticated requests when auth is configured', async () => {
    const app = await buildHttpApp(createServerStub(), {
      host: '127.0.0.1',
      port: 3000,
      authToken: 'super-secret-token',
    })

    const response = await app.inject({
      method: 'POST',
      url: '/mcp',
      payload: { jsonrpc: '2.0', id: 1, method: 'initialize' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ error: 'Unauthorized' })
    expect(connectMock).not.toHaveBeenCalled()
    await app.close()
  })

  it('rejects invalid bearer tokens', async () => {
    const app = await buildHttpApp(createServerStub(), {
      host: '127.0.0.1',
      port: 3000,
      authToken: 'super-secret-token',
    })

    const response = await app.inject({
      method: 'POST',
      url: '/mcp',
      headers: { authorization: 'Bearer wrong-token' },
      payload: { jsonrpc: '2.0', id: 1, method: 'initialize' },
    })

    expect(response.statusCode).toBe(401)
    expect(connectMock).not.toHaveBeenCalled()
    await app.close()
  })

  it('accepts valid bearer tokens', async () => {
    const app = await buildHttpApp(createServerStub(), {
      host: '127.0.0.1',
      port: 3000,
      authToken: 'super-secret-token',
    })

    const response = await app.inject({
      method: 'POST',
      url: '/mcp',
      headers: { authorization: 'Bearer super-secret-token' },
      payload: { jsonrpc: '2.0', id: 1, method: 'initialize' },
    })

    expect(response.statusCode).toBe(200)
    expect(connectMock).toHaveBeenCalledTimes(1)
    await app.close()
  })

  it('returns 400 for GET requests without a session id', async () => {
    const app = await buildHttpApp(createServerStub(), { host: '127.0.0.1', port: 3000 })

    const response = await app.inject({
      method: 'GET',
      url: '/mcp',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ error: 'Missing or invalid mcp-session-id' })
    await app.close()
  })
})

function createServerStub() {
  return {
    connect: connectMock.mockResolvedValue(undefined),
  }
}
