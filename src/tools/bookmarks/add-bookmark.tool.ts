import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type AddBookmarkParams = {
  file: string | undefined
  folder: string | undefined
  search: string | undefined
  url: string | undefined
  subpath: string | undefined
  title: string | undefined
  vault: string | undefined
}

export async function addBookmarkHandler(params: AddBookmarkParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('bookmark', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerAddBookmarkTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_add_bookmark',
    {
      title: 'Add Bookmark',
      description: 'Add a bookmark for a file, folder, search query, or URL',
      inputSchema: {
        file: z.string().optional().describe('Note name to bookmark (fuzzy match)'),
        folder: z.string().optional().describe('Folder path to bookmark'),
        search: z.string().optional().describe('Search query to bookmark'),
        url: z.string().optional().describe('URL to bookmark'),
        subpath: z.string().optional().describe('Subpath within the file (e.g. #heading)'),
        title: z.string().optional().describe('Custom title for the bookmark'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => addBookmarkHandler(params, cli),
  )
}
