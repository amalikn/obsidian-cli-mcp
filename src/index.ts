#!/usr/bin/env node
import { createServer } from './server.js'
import { resolveRuntimeConfig } from './runtime-config.js'
import { startStdioTransport } from './transports/stdio.js'
import { startHttpTransport } from './transports/http.js'

const runtimeConfig = resolveRuntimeConfig()
const server = createServer(runtimeConfig)

if (runtimeConfig.transport === 'http') {
  startHttpTransport(server, {
    port: runtimeConfig.port,
    host: runtimeConfig.httpHost,
    authToken: runtimeConfig.httpAuthToken,
  }).catch((err: Error) => {
    console.error('Failed to start HTTP transport:', err.message)
    process.exit(1)
  })
} else {
  startStdioTransport(server).catch((err: Error) => {
    console.error('Failed to start stdio transport:', err.message)
    process.exit(1)
  })
}
