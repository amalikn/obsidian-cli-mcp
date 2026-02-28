import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListBasesParams = { vault: string | undefined }

export async function listBasesHandler(params: ListBasesParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('bases', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListBasesTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_bases',
    {
      title: 'List Bases',
      description: 'List all Obsidian Bases files in the vault (requires Obsidian Bases plugin)',
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listBasesHandler(params, cli),
  )
}
