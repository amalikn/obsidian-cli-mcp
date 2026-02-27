import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type FileInfoParams = { file: string | undefined; path: string | undefined; vault: string | undefined }

export async function fileInfoHandler(params: FileInfoParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('file', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerFileInfoTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_file_info',
    {
      title: 'File Info',
      description: 'Get metadata and information about a note (path, size, dates, tags, links…)',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match, like wikilinks)'),
        path: z.string().optional().describe('Exact file path (e.g. folder/note.md)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => fileInfoHandler(params, cli),
  )
}
