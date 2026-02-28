import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListPluginsEnabledParams = {
  filter: string | undefined
  versions: boolean | undefined
  format: string | undefined
  vault: string | undefined
}

export async function listPluginsEnabledHandler(params: ListPluginsEnabledParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('plugins:enabled', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListPluginsEnabledTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_plugins_enabled',
    {
      title: 'List Enabled Plugins',
      description: 'List only the currently active/enabled community plugins in the Obsidian vault. Use this when the user asks which plugins are active, turned on, or currently running.',
      inputSchema: {
        filter: z.string().optional().describe('Filter plugins by name or id'),
        versions: z.boolean().optional().describe('Include version information'),
        format: z.string().optional().describe('Output format (e.g. json)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listPluginsEnabledHandler(params, cli),
  )
}
