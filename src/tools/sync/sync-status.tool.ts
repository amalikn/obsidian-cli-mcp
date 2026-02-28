import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SyncStatusParams = { vault: string | undefined }

export async function syncStatusHandler(params: SyncStatusParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('sync:status', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSyncStatusTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_sync_status',
    {
      title: 'Sync Status',
      description: 'Get the current Obsidian Sync status (requires Obsidian Sync subscription)',
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => syncStatusHandler(params, cli),
  )
}
