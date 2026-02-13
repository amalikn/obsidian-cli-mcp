import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListOrphansParams = { vault: string | undefined }

export async function listOrphansHandler(params: ListOrphansParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('orphans', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListOrphansTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_orphans',
    {
      title: 'List Orphans',
      description: 'List notes with no incoming links (orphaned notes)',
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listOrphansHandler(params, cli),
  )
}
