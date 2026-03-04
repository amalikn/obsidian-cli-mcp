import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type InstallThemeParams = {
  name: string
  enable: boolean | undefined
  vault: string | undefined
}

export async function installThemeHandler(params: InstallThemeParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('theme:install', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerInstallThemeTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_install_theme',
    {
      title: 'Install Theme',
      description: 'Install a community theme from the Obsidian theme gallery. Use this when the user wants to install a new theme or add a visual style.',
      inputSchema: {
        name: z.string().describe('Theme name (required)'),
        enable: z.boolean().optional().describe('Enable the theme after installation'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => installThemeHandler(params, cli),
  )
}
