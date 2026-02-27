import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type RenameNoteParams = {
  file: string | undefined
  path: string | undefined
  name: string
  vault: string | undefined
}

export async function renameNoteHandler(params: RenameNoteParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('rename', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerRenameNoteTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_rename_note',
    {
      title: 'Rename Note',
      description: 'Rename a note (updates all backlinks automatically)',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        name: z.string().describe('New name for the note (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => renameNoteHandler(params, cli),
  )
}
