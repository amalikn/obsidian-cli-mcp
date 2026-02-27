import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListDeadendsParams = { total: boolean | undefined; all: boolean | undefined; vault: string | undefined }

export async function listDeadendsHandler(params: ListDeadendsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('deadends', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListDeadendsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_deadends',
    {
      title: 'List Dead-end Links',
      description: 'List notes that have outgoing links but no incoming links (dead-end notes)',
      inputSchema: {
        total: z.boolean().optional().describe('Show only the total count'),
        all: z.boolean().optional().describe('Include all file types, not just markdown'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listDeadendsHandler(params, cli),
  )
}
