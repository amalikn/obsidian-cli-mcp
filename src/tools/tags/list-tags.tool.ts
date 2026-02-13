import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListTagsParams = { file: string | undefined; path: string | undefined; vault: string | undefined }

export async function listTagsHandler(params: ListTagsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('tags', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListTagsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_tags',
    {
      title: 'List Tags',
      description: 'List all tags in the vault or in a specific note',
      inputSchema: {
        file: z.string().optional().describe('Note name to scope tags to'),
        path: z.string().optional().describe('Exact file path to scope tags to'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listTagsHandler(params, cli),
  )
}
