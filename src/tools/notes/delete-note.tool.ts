import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type DeleteNoteParams = {
  file: string | undefined
  path: string | undefined
  permanent: boolean | undefined
  vault: string | undefined
}

export async function deleteNoteHandler(params: DeleteNoteParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('delete', params)
    return { content: [{ type: 'text' as const, text: output || 'Note deleted.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerDeleteNoteTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_delete_note',
    {
      title: 'Delete Note',
      description: 'Delete an Obsidian note (moves to trash by default)',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        permanent: z.boolean().optional().describe('Skip trash and delete permanently'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => deleteNoteHandler(params, cli),
  )
}
