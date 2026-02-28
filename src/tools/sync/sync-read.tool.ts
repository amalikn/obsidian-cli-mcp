import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SyncReadParams = {
  file: string | undefined
  path: string | undefined
  version: number
  vault: string | undefined
}

export async function syncReadHandler(params: SyncReadParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('sync:read', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSyncReadTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_sync_read',
    {
      title: 'Sync Read',
      description: 'Read a specific sync version of a file (requires Obsidian Sync)',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        version: z.number().describe('Version number to read (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => syncReadHandler(params, cli),
  )
}
