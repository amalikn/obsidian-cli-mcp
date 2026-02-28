import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type HistoryListParams = { vault: string | undefined }

export async function historyListHandler(params: HistoryListParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('history:list', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerHistoryListTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_history_list',
    {
      title: 'History List',
      description: 'List all file versions tracked by the File Recovery plugin',
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => historyListHandler(params, cli),
  )
}
