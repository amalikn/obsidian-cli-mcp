import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GovernedVaultService } from '../../services/governed-vault.service.js'

type GovernedSearchParams = {
  query: string
  path: string | undefined
  limit: number | undefined
}

export function registerGovernedSearchNotesTool(
  server: McpServer,
  governedVault: GovernedVaultService,
): void {
  server.registerTool(
    'obsidian_search',
    {
      title: 'Governed Search',
      description: 'Search governed discovery zones with server-side vault policy filtering',
      inputSchema: {
        query: z.string().describe('Search query (required)'),
        path: z.string().optional().describe('Optional governed folder or note path filter'),
        limit: z.number().int().min(1).max(100).optional().describe('Maximum number of matches'),
      },
    },
    (params: GovernedSearchParams) => {
      try {
        const matches = governedVault.search(params.query, {
          path: params.path,
          limit: params.limit,
        })

        const text = matches.length
          ? matches.map((match) => `- ${match.path}:${match.line} ${match.excerpt}`).join('\n')
          : 'No governed matches found.'

        return { content: [{ type: 'text' as const, text }] }
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
      }
    },
  )
}
