import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListBaseViewsParams = { file: string | undefined; path: string | undefined; vault: string | undefined }

export async function listBaseViewsHandler(params: ListBaseViewsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('base:views', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListBaseViewsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_base_views',
    {
      title: 'List Base Views',
      description: 'List all views defined in an Obsidian Base file',
      inputSchema: {
        file: z.string().optional().describe('Base file name (fuzzy match)'),
        path: z.string().optional().describe('Exact base file path (e.g. folder/base.base)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listBaseViewsHandler(params, cli),
  )
}
