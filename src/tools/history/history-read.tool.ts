import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type HistoryReadParams = {
  file: string | undefined
  path: string | undefined
  version: number | undefined
  vault: string | undefined
}

export async function historyReadHandler(params: HistoryReadParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('history:read', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerHistoryReadTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_history_read',
    {
      title: 'History Read',
      description: 'Read a specific version of a note from the File Recovery plugin history',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        version: z.number().optional().describe('Version number to read (default: 1 = most recent)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => historyReadHandler(params, cli),
  )
}
