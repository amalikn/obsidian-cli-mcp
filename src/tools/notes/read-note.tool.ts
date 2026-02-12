import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ReadNoteParams = {
  file: string | undefined
  path: string | undefined
  vault: string | undefined
}

export async function readNoteHandler(params: ReadNoteParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('read', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerReadNoteTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_read_note',
    {
      title: 'Read Note',
      description: 'Read the content of an Obsidian note by name or exact path',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => readNoteHandler(params, cli),
  )
}
