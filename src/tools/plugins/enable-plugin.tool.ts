import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type EnablePluginParams = { id: string; filter: string | undefined; vault: string | undefined }

export async function enablePluginHandler(params: EnablePluginParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('plugin:enable', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerEnablePluginTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_enable_plugin',
    {
      title: 'Enable Plugin',
      description: 'Enable an installed plugin',
      inputSchema: {
        id: z.string().describe('Plugin id (required)'),
        filter: z.string().optional().describe('Additional filter'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => enablePluginHandler(params, cli),
  )
}
