import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SyncDeletedParams = { total: boolean | undefined; vault: string | undefined }

export async function syncDeletedHandler(params: SyncDeletedParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('sync:deleted', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSyncDeletedTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_sync_deleted',
    {
      title: 'Sync Deleted',
      description: 'List files deleted from the vault that are still in Obsidian Sync history',
      inputSchema: {
        total: z.boolean().optional().describe('Show only the total count'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => syncDeletedHandler(params, cli),
  )
}
