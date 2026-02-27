import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type OutlineParams = {
  file: string | undefined
  path: string | undefined
  format: string | undefined
  total: boolean | undefined
  vault: string | undefined
}

export async function outlineHandler(params: OutlineParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('outline', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerOutlineTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_outline',
    {
      title: 'Note Outline',
      description: 'Get the heading outline (table of contents) of a note',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        format: z.string().optional().describe('Output format (e.g. json)'),
        total: z.boolean().optional().describe('Show only the total heading count'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => outlineHandler(params, cli),
  )
}
