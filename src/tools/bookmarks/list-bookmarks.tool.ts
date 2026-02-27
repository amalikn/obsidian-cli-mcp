import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListBookmarksParams = {
  total: boolean | undefined
  verbose: boolean | undefined
  format: string | undefined
  vault: string | undefined
}

export async function listBookmarksHandler(params: ListBookmarksParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('bookmarks', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListBookmarksTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_bookmarks',
    {
      title: 'List Bookmarks',
      description: 'List all bookmarks in the vault',
      inputSchema: {
        total: z.boolean().optional().describe('Show only the total count'),
        verbose: z.boolean().optional().describe('Show detailed bookmark information'),
        format: z.string().optional().describe('Output format (e.g. json)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listBookmarksHandler(params, cli),
  )
}
