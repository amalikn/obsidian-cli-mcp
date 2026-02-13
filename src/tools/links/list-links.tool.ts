import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListLinksParams = { file: string | undefined; path: string | undefined; vault: string | undefined }

export async function listLinksHandler(params: ListLinksParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('links', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListLinksTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_links',
    {
      title: 'List Links',
      description: 'List outgoing links from a note',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match)'),
        path: z.string().optional().describe('Exact file path'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listLinksHandler(params, cli),
  )
}
