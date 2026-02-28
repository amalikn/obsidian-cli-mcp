import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SyncHistoryParams = {
  file: string | undefined
  path: string | undefined
  total: boolean | undefined
  vault: string | undefined
}

export async function syncHistoryHandler(params: SyncHistoryParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('sync:history', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSyncHistoryTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_sync_history',
    {
      title: 'Sync History',
      description: 'List sync history versions for a file (requires Obsidian Sync)',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        total: z.boolean().optional().describe('Show only the total version count'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => syncHistoryHandler(params, cli),
  )
}
