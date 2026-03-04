import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SetThemeParams = {
  name: string
  vault: string | undefined
}

export async function setThemeHandler(params: SetThemeParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('theme:set', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSetThemeTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_set_theme',
    {
      title: 'Set Theme',
      description: 'Activate an Obsidian theme by name, or reset to the default theme by passing an empty name. Use this when the user wants to change, switch, or reset the Obsidian theme.',
      inputSchema: {
        name: z.string().describe('Theme name to activate, or empty string to reset to default'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => setThemeHandler(params, cli),
  )
}
