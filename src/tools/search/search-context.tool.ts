import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SearchContextParams = {
  query: string
  path: string | undefined
  limit: string | undefined
  vault: string | undefined
}

export async function searchContextHandler(params: SearchContextParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('search:context', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSearchContextTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_search_context',
    {
      title: 'Search with Context',
      description: 'Search the vault and return matching lines with surrounding context',
      inputSchema: {
        query: z.string().describe('Search query (required)'),
        path: z.string().optional().describe('Limit search to this folder'),
        limit: z.string().optional().describe('Maximum number of results'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => searchContextHandler(params, cli),
  )
}
