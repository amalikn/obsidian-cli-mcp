import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListTabsParams = {
  ids: boolean | undefined
  vault: string | undefined
}

export async function listTabsHandler(params: ListTabsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('tabs', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListTabsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_tabs',
    {
      title: 'List Tabs',
      description: 'List all currently open tabs in Obsidian. Use this when the user asks about open tabs, currently viewed notes, or the tab bar.',
      inputSchema: {
        ids: z.boolean().optional().describe('Include IDs in output'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listTabsHandler(params, cli),
  )
}
