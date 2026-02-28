import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type GetPluginParams = { id: string; vault: string | undefined }

export async function getPluginHandler(params: GetPluginParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('plugin', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerGetPluginTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_get_plugin',
    {
      title: 'Get Plugin',
      description: 'Get information about a specific plugin by its id',
      inputSchema: {
        id: z.string().describe('Plugin id (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => getPluginHandler(params, cli),
  )
}
