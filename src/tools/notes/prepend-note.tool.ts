import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type PrependNoteParams = {
  file: string | undefined
  path: string | undefined
  content: string
  inline: boolean | undefined
  vault: string | undefined
}

export async function prependNoteHandler(params: PrependNoteParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('prepend', params)
    return { content: [{ type: 'text' as const, text: output || 'Content prepended.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerPrependNoteTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_prepend_note',
    {
      title: 'Prepend to Note',
      description: 'Prepend content to an existing Obsidian note',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        content: z.string().describe('Content to prepend (required)'),
        inline: z.boolean().optional().describe('Prepend without trailing newline'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => prependNoteHandler(params, cli),
  )
}
