import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListThemesParams = {
  versions: boolean | undefined
  vault: string | undefined
}

export async function listThemesHandler(params: ListThemesParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('themes', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListThemesTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_themes',
    {
      title: 'List Themes',
      description: 'List all installed Obsidian themes. Use this when the user asks about available themes, installed themes, or wants to browse visual styles.',
      inputSchema: {
        versions: z.boolean().optional().describe('Include version information'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listThemesHandler(params, cli),
  )
}
