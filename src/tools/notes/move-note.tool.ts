import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type MoveNoteParams = {
  file: string | undefined
  path: string | undefined
  to: string
  vault: string | undefined
}

export async function moveNoteHandler(params: MoveNoteParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('move', params)
    return { content: [{ type: 'text' as const, text: output || 'Note moved.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerMoveNoteTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_move_note',
    {
      title: 'Move Note',
      description: 'Move or rename an Obsidian note to a new folder or path',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact source file path'),
        to: z.string().describe('Destination folder or path (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => moveNoteHandler(params, cli),
  )
}
