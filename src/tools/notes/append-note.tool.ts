import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type AppendNoteParams = {
  file: string | undefined
  path: string | undefined
  content: string
  inline: boolean | undefined
  vault: string | undefined
}

export async function appendNoteHandler(params: AppendNoteParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('append', params)
    return { content: [{ type: 'text' as const, text: output || 'Content appended.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerAppendNoteTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_append_note',
    {
      title: 'Append to Note',
      description: 'Append content to an existing Obsidian note',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        content: z.string().describe('Content to append (required)'),
        inline: z.boolean().optional().describe('Append without leading newline'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => appendNoteHandler(params, cli),
  )
}
