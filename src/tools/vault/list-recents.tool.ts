import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListRecentsParams = {
  total: boolean | undefined
  vault: string | undefined
}

export async function listRecentsHandler(params: ListRecentsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('recents', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListRecentsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_recents',
    {
      title: 'List Recent Files',
      description: 'List recently opened files in Obsidian. Use this when the user asks about recent files, recently opened notes, or their browsing history.',
      inputSchema: {
        total: z.boolean().optional().describe('Show total count only'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listRecentsHandler(params, cli),
  )
}
