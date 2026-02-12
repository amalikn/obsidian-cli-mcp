import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type GetPropertyParams = {
  name: string
  file: string | undefined
  path: string | undefined
  vault: string | undefined
}

export async function getPropertyHandler(params: GetPropertyParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('property:read', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerGetPropertyTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_get_property',
    {
      title: 'Get Property',
      description: 'Read the value of a frontmatter property from a note',
      inputSchema: {
        name: z.string().describe('Property name (required)'),
        file: z.string().optional().describe('Note name (fuzzy match)'),
        path: z.string().optional().describe('Exact file path'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => getPropertyHandler(params, cli),
  )
}
