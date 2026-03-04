import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type DiffParams = {
  file: string | undefined
  path: string | undefined
  from: string | undefined
  to: string | undefined
  filter: string | undefined
  vault: string | undefined
}

export async function diffHandler(params: DiffParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('diff', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerDiffTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_diff',
    {
      title: 'Diff Note Versions',
      description: 'Compare two versions of a note or compare a note between two dates. Use this when the user wants to see changes, differences, or the history of modifications to a note.',
      inputSchema: {
        file: z.string().optional().describe('Note file name'),
        path: z.string().optional().describe('Full path to the note'),
        from: z.string().optional().describe('Start date or version for the comparison'),
        to: z.string().optional().describe('End date or version for the comparison'),
        filter: z.string().optional().describe('Filter pattern to narrow the diff'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => diffHandler(params, cli),
  )
}
