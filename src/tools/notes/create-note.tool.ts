import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type CreateNoteParams = {
  name: string | undefined
  path: string | undefined
  content: string | undefined
  template: string | undefined
  overwrite: boolean | undefined
  vault: string | undefined
}

export async function createNoteHandler(params: CreateNoteParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('create', params)
    return { content: [{ type: 'text' as const, text: output || 'Note created.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerCreateNoteTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_create_note',
    {
      title: 'Create Note',
      description: 'Create a new Obsidian note with optional content or template',
      inputSchema: {
        name: z.string().optional().describe('File name for the new note'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        content: z.string().optional().describe('Initial content'),
        template: z.string().optional().describe('Template name to use'),
        overwrite: z.boolean().optional().describe('Overwrite if file already exists'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => createNoteHandler(params, cli),
  )
}
