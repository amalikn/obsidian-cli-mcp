import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type SetPropertyParams = {
  name: string
  value: string
  type: string | undefined
  file: string | undefined
  path: string | undefined
  vault: string | undefined
}

export async function setPropertyHandler(params: SetPropertyParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('property:set', params)
    return { content: [{ type: 'text' as const, text: output || 'Property set.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerSetPropertyTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_set_property',
    {
      title: 'Set Property',
      description: 'Set a frontmatter property on a note',
      inputSchema: {
        name: z.string().describe('Property name (required)'),
        value: z.string().describe('Property value (required)'),
        type: z.enum(['text', 'list', 'number', 'checkbox', 'date', 'datetime']).optional().describe('Property type'),
        file: z.string().optional().describe('Note name (fuzzy match)'),
        path: z.string().optional().describe('Exact file path'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => setPropertyHandler(params, cli),
  )
}
