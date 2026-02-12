import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type RemovePropertyParams = {
  name: string
  file: string | undefined
  path: string | undefined
  vault: string | undefined
}

export async function removePropertyHandler(params: RemovePropertyParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('property:remove', params)
    return { content: [{ type: 'text' as const, text: output || 'Property removed.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerRemovePropertyTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_remove_property',
    {
      title: 'Remove Property',
      description: 'Remove a frontmatter property from a note',
      inputSchema: {
        name: z.string().describe('Property name (required)'),
        file: z.string().optional().describe('Note name (fuzzy match)'),
        path: z.string().optional().describe('Exact file path'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => removePropertyHandler(params, cli),
  )
}
