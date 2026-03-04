import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type GetThemeParams = {
  name: string | undefined
  vault: string | undefined
}

export async function getThemeHandler(params: GetThemeParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('theme', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerGetThemeTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_get_theme',
    {
      title: 'Get Theme',
      description: 'Get information about a specific installed Obsidian theme. Use this when the user asks about a particular theme or wants to see theme details.',
      inputSchema: {
        name: z.string().optional().describe('Theme name'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => getThemeHandler(params, cli),
  )
}
