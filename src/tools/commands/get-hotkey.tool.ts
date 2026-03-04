import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type GetHotkeyParams = {
  id: string
  verbose: boolean | undefined
  vault: string | undefined
}

export async function getHotkeyHandler(params: GetHotkeyParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('hotkey', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerGetHotkeyTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_get_hotkey',
    {
      title: 'Get Hotkey',
      description: 'Get the keyboard shortcut assigned to a specific Obsidian command. Use this when the user asks about the hotkey for a specific command or action.',
      inputSchema: {
        id: z.string().describe('The command ID to look up the hotkey for'),
        verbose: z.boolean().optional().describe('Show verbose output'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => getHotkeyHandler(params, cli),
  )
}
