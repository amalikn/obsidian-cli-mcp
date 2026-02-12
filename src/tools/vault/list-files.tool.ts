import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListFilesParams = {
  folder: string | undefined
  ext: string | undefined
  vault: string | undefined
}

export async function listFilesHandler(params: ListFilesParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('files', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListFilesTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_files',
    {
      title: 'List Files',
      description: 'List files in the vault, optionally filtered by folder or extension',
      inputSchema: {
        folder: z.string().optional().describe('Filter by folder path'),
        ext: z.string().optional().describe('Filter by file extension (e.g. md)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listFilesHandler(params, cli),
  )
}
