import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SearchNotesParams = {
  query: string
  path: string | undefined
  limit: string | undefined
  vault: string | undefined
}

export async function searchNotesHandler(params: SearchNotesParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('search', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSearchNotesTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_search',
    {
      title: 'Search Notes',
      description: 'Search the vault for text, optionally limited to a folder',
      inputSchema: {
        query: z.string().describe('Search query (required)'),
        path: z.string().optional().describe('Limit search to this folder'),
        limit: z.string().optional().describe('Maximum number of results'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => searchNotesHandler(params, cli),
  )
}
