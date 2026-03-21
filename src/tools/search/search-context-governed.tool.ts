import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GovernedVaultService } from '../../services/governed-vault.service.js'

type GovernedSearchContextParams = {
  query: string
  path: string | undefined
  limit: number | undefined
  contextLines: number | undefined
}

export function registerGovernedSearchContextTool(
  server: McpServer,
  governedVault: GovernedVaultService,
): void {
  server.registerTool(
    'obsidian_search_context',
    {
      title: 'Governed Search With Context',
      description: 'Search governed discovery zones and return bounded context with server-side filtering',
      inputSchema: {
        query: z.string().describe('Search query (required)'),
        path: z.string().optional().describe('Optional governed folder or note path filter'),
        limit: z.number().int().min(1).max(100).optional().describe('Maximum number of matches'),
        contextLines: z
          .number()
          .int()
          .min(0)
          .max(5)
          .optional()
          .describe('Number of lines of context before and after each match'),
      },
    },
    (params: GovernedSearchContextParams) => {
      try {
        const matches = governedVault.search(params.query, {
          path: params.path,
          limit: params.limit,
          contextLines: params.contextLines,
        })

        const text = matches.length
          ? matches
              .map((match) => {
                const header = `## ${match.path}:${match.line}`
                const body = match.context ?? match.excerpt
                return `${header}\n${body}`
              })
              .join('\n\n')
          : 'No governed matches found.'

        return { content: [{ type: 'text' as const, text }] }
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
      }
    },
  )
}
