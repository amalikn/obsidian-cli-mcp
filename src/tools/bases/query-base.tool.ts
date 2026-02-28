import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type QueryBaseParams = {
  file: string | undefined
  path: string | undefined
  view: string | undefined
  format: string | undefined
  vault: string | undefined
}

export async function queryBaseHandler(params: QueryBaseParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('base:query', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerQueryBaseTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_query_base',
    {
      title: 'Query Base',
      description: 'Query items from an Obsidian Base, optionally filtered by view',
      inputSchema: {
        file: z.string().optional().describe('Base file name (fuzzy match)'),
        path: z.string().optional().describe('Exact base file path (e.g. folder/base.base)'),
        view: z.string().optional().describe('View name to query'),
        format: z.string().optional().describe('Output format (e.g. json)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => queryBaseHandler(params, cli),
  )
}
