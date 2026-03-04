import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

export async function versionHandler(params: Record<string, never>, cli: ObsidianCliService) {
  try {
    const output = await cli.run('version', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerVersionTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_version',
    {
      title: 'Get Version',
      description: 'Get the current version of Obsidian and the Obsidian CLI. Use this when the user asks about the Obsidian version or CLI version.',
      inputSchema: {},
    },
    (params) => versionHandler(params as Record<string, never>, cli),
  )
}
