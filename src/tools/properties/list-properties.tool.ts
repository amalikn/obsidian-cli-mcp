import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListPropertiesParams = {
  file: string | undefined
  path: string | undefined
  vault: string | undefined
}

export async function listPropertiesHandler(params: ListPropertiesParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('properties', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListPropertiesTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_properties',
    {
      title: 'List Properties',
      description: 'List frontmatter properties in the vault or for a specific note',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match)'),
        path: z.string().optional().describe('Exact file path'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listPropertiesHandler(params, cli),
  )
}
