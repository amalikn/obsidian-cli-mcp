import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListBacklinksParams = { file: string | undefined; path: string | undefined; vault: string | undefined }

export async function listBacklinksHandler(params: ListBacklinksParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('backlinks', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListBacklinksTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_backlinks',
    {
      title: 'List Backlinks',
      description: 'List all notes that link to a given note',
      inputSchema: {
        file: z.string().optional().describe('Target note name (fuzzy match)'),
        path: z.string().optional().describe('Exact target file path'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listBacklinksHandler(params, cli),
  )
}
