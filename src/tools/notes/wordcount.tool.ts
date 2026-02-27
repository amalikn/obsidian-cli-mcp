import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type WordcountParams = {
  file: string | undefined
  path: string | undefined
  words: boolean | undefined
  characters: boolean | undefined
  vault: string | undefined
}

export async function wordcountHandler(params: WordcountParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('wordcount', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerWordcountTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_wordcount',
    {
      title: 'Word Count',
      description: 'Get the word and character count of a note',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        words: z.boolean().optional().describe('Show only the word count'),
        characters: z.boolean().optional().describe('Show only the character count'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => wordcountHandler(params, cli),
  )
}
