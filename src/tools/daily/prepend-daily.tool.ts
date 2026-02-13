import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type PrependDailyParams = { content: string; inline: boolean | undefined; vault: string | undefined }

export async function prependDailyHandler(params: PrependDailyParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('daily:prepend', params)
    return { content: [{ type: 'text' as const, text: output || 'Content prepended to daily note.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerPrependDailyTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_prepend_daily',
    {
      title: "Prepend to Daily Note",
      description: "Prepend content to today's daily note",
      inputSchema: {
        content: z.string().describe('Content to prepend (required)'),
        inline: z.boolean().optional().describe('Prepend without trailing newline'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => prependDailyHandler(params, cli),
  )
}
