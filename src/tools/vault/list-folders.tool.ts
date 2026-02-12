import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListFoldersParams = {
  folder: string | undefined
  vault: string | undefined
}

export async function listFoldersHandler(params: ListFoldersParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('folders', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListFoldersTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_folders',
    {
      title: 'List Folders',
      description: 'List folders in the vault, optionally filtered by parent folder',
      inputSchema: {
        folder: z.string().optional().describe('Filter by parent folder path'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listFoldersHandler(params, cli),
  )
}
