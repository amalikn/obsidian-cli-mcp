import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type DailyPathParams = {
  vault: string | undefined
}

export async function dailyPathHandler(params: DailyPathParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('daily:path', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerDailyPathTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_daily_path',
    {
      title: 'Get Daily Note Path',
      description: 'Get the file path where today\'s daily note would be created, without creating it. Use this when the user wants to know the daily note path or folder location.',
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => dailyPathHandler(params, cli),
  )
}
