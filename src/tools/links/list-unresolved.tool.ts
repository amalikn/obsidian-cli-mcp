import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListUnresolvedParams = {
  total: boolean | undefined
  counts: boolean | undefined
  verbose: boolean | undefined
  format: string | undefined
  vault: string | undefined
}

export async function listUnresolvedHandler(params: ListUnresolvedParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('unresolved', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListUnresolvedTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_unresolved',
    {
      title: 'List Unresolved Links',
      description: 'List all unresolved (broken) wikilinks in the vault',
      inputSchema: {
        total: z.boolean().optional().describe('Show only the total count'),
        counts: z.boolean().optional().describe('Show occurrence counts per link'),
        verbose: z.boolean().optional().describe('Show detailed information including source notes'),
        format: z.string().optional().describe('Output format (e.g. json)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listUnresolvedHandler(params, cli),
  )
}
