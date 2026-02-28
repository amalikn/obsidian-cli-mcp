import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SyncRestoreParams = {
  file: string | undefined
  path: string | undefined
  version: number
  vault: string | undefined
}

export async function syncRestoreHandler(params: SyncRestoreParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('sync:restore', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSyncRestoreTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_sync_restore',
    {
      title: 'Sync Restore',
      description: 'Restore a file to a specific sync version (requires Obsidian Sync)',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        version: z.number().describe('Version number to restore (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => syncRestoreHandler(params, cli),
  )
}
