import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListHotkeysParams = {
  total: boolean | undefined
  verbose: boolean | undefined
  format: string | undefined
  all: boolean | undefined
  vault: string | undefined
}

export async function listHotkeysHandler(params: ListHotkeysParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('hotkeys', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListHotkeysTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_hotkeys',
    {
      title: 'List Hotkeys',
      description: 'List all configured keyboard shortcuts and hotkeys in Obsidian. Use this when the user asks about hotkeys, keyboard shortcuts, or key bindings.',
      inputSchema: {
        total: z.boolean().optional().describe('Show total count'),
        verbose: z.boolean().optional().describe('Show verbose output'),
        format: z.string().optional().describe('Output format (e.g. json)'),
        all: z.boolean().optional().describe('Include all hotkeys, even unassigned'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listHotkeysHandler(params, cli),
  )
}
