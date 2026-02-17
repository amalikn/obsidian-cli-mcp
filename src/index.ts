#!/usr/bin/env node
import { createServer } from './server.js'
import { startStdioTransport } from './transports/stdio.js'
import { startHttpTransport } from './transports/http.js'

const transport = process.env['MCP_TRANSPORT'] ?? 'stdio'
const port = parseInt(process.env['MCP_PORT'] ?? '3000', 10)

const server = createServer()

if (transport === 'http') {
  startHttpTransport(server, port).catch((err: Error) => {
    console.error('Failed to start HTTP transport:', err.message)
    process.exit(1)
  })
} else {
  startStdioTransport(server).catch((err: Error) => {
    console.error('Failed to start stdio transport:', err.message)
    process.exit(1)
  })
}
