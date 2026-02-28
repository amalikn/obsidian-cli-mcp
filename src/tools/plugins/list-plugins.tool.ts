import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListPluginsParams = {
  filter: string | undefined
  versions: boolean | undefined
  format: string | undefined
  vault: string | undefined
}

export async function listPluginsHandler(params: ListPluginsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('plugins', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListPluginsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_plugins',
    {
      title: 'List Plugins',
      description: 'List all installed plugins in the vault',
      inputSchema: {
        filter: z.string().optional().describe('Filter plugins by name or id'),
        versions: z.boolean().optional().describe('Include version information'),
        format: z.string().optional().describe('Output format (e.g. json)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listPluginsHandler(params, cli),
  )
}
