import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type AppendDailyParams = { content: string; inline: boolean | undefined; vault: string | undefined }

export async function appendDailyHandler(params: AppendDailyParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('daily:append', params)
    return { content: [{ type: 'text' as const, text: output || 'Content appended to daily note.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerAppendDailyTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_append_daily',
    {
      title: "Append to Daily Note",
      description: "Append content to today's daily note",
      inputSchema: {
        content: z.string().describe('Content to append (required)'),
        inline: z.boolean().optional().describe('Append without leading newline'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => appendDailyHandler(params, cli),
  )
}
