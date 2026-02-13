import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ReadDailyParams = { vault: string | undefined }

export async function readDailyHandler(params: ReadDailyParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('daily:read', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerReadDailyTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_read_daily',
    {
      title: 'Read Daily Note',
      description: "Read today's daily note content",
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => readDailyHandler(params, cli),
  )
}
