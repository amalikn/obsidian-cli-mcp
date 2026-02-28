import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type CreateBaseItemParams = {
  file: string | undefined
  path: string | undefined
  view: string | undefined
  name: string | undefined
  content: string | undefined
  vault: string | undefined
}

export async function createBaseItemHandler(params: CreateBaseItemParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('base:create', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerCreateBaseItemTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_create_base_item',
    {
      title: 'Create Base Item',
      description: 'Create a new item (note) in an Obsidian Base',
      inputSchema: {
        file: z.string().optional().describe('Base file name (fuzzy match)'),
        path: z.string().optional().describe('Exact base file path (e.g. folder/base.base)'),
        view: z.string().optional().describe('View name to create item in'),
        name: z.string().optional().describe('Name for the new item'),
        content: z.string().optional().describe('Initial content for the new item'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => createBaseItemHandler(params, cli),
  )
}
