import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListAliasesParams = {
  file: string | undefined
  path: string | undefined
  total: boolean | undefined
  verbose: boolean | undefined
  active: boolean | undefined
  vault: string | undefined
}

export async function listAliasesHandler(params: ListAliasesParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('aliases', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListAliasesTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_aliases',
    {
      title: 'List Aliases',
      description: 'List all note aliases defined in frontmatter across the vault, or for a specific note. Use this when the user asks about aliases, alternative names, or note aliases.',
      inputSchema: {
        file: z.string().optional().describe('Filter aliases for a specific file'),
        path: z.string().optional().describe('Filter aliases by path'),
        total: z.boolean().optional().describe('Show total count only'),
        verbose: z.boolean().optional().describe('Show verbose output'),
        active: z.boolean().optional().describe('Show only active aliases'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listAliasesHandler(params, cli),
  )
}
