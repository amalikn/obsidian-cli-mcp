import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type UninstallThemeParams = {
  name: string
  vault: string | undefined
}

export async function uninstallThemeHandler(params: UninstallThemeParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('theme:uninstall', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerUninstallThemeTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_uninstall_theme',
    {
      title: 'Uninstall Theme',
      description: 'Uninstall an Obsidian theme. Use this when the user wants to remove or delete a theme.',
      inputSchema: {
        name: z.string().describe('Theme name (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => uninstallThemeHandler(params, cli),
  )
}
